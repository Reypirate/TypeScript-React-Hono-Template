import type { AuthSession } from "./auth";

import { HTTPException } from "hono/http-exception";
import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { createApp } from "./app";

const env = {
  VITE_APP_URL: "http://localhost:4000",
  VITE_API_URL: "http://localhost:4001",
};
const user = {
  id: "user_1",
  name: "Ada Lovelace",
  email: "ada@example.com",
  emailVerified: false,
  image: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};
const session: AuthSession = {
  user,
  session: {
    id: "session_1",
    userId: user.id,
    token: "private-session-token",
    expiresAt: new Date(Date.now() + 60_000),
    createdAt: new Date(),
    updatedAt: new Date(),
    ipAddress: null,
    userAgent: null,
  },
};

function setup(currentSession: AuthSession | null = null) {
  const auth = {
    handler: vi.fn((_request: Request) => Promise.resolve(new Response("auth response"))),
    getSession: vi.fn((_headers: Headers) => Promise.resolve(currentSession)),
  };
  return { ...createApp({ env, auth }), auth };
}

afterEach(() => vi.restoreAllMocks());

describe("API", () => {
  it("serves health without consulting authentication", async () => {
    const { app, auth } = setup();
    const response = await app.request("/api/health");
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: "ok" });
    expect(response.headers.get("X-Request-Id")).toBeTruthy();
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(auth.getSession).not.toHaveBeenCalled();
  });

  it("returns JSON 404s before a frontend fallback can run", async () => {
    const { app } = setup();
    app.get("*", (c) => c.html("frontend"));
    await Promise.all(
      ["/api", "/api/unknown", "/api/assets/missing.js"].map(async (path) => {
        const response = await app.request(path);
        expect(response.status).toBe(404);
        expect(await response.json()).toEqual({ error: "Not Found" });
      }),
    );
    expect(await (await app.request("/dashboard")).text()).toBe("frontend");
  });

  it("exposes only public runtime settings and prevents caching them", async () => {
    const { app } = createApp({
      env: { ...env, ...{ BETTER_AUTH_SECRET: "server-secret", VITE_SECRET: "not-allowlisted" } },
      auth: setup().auth,
    });
    const response = await app.request("/api/runtime.js");
    const script = await response.text();
    expect(script).toContain(env.VITE_APP_URL);
    expect(script).toContain(env.VITE_API_URL);
    expect(script).not.toContain("server-secret");
    expect(script).not.toContain("not-allowlisted");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("allows credentialed CORS from the configured frontend", async () => {
    const { app } = setup();
    const response = await app.request("/api/me", {
      method: "OPTIONS",
      headers: { Origin: env.VITE_APP_URL, "Access-Control-Request-Method": "GET" },
    });
    expect(response.status).toBe(204);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(env.VITE_APP_URL);
    expect(response.headers.get("Access-Control-Allow-Credentials")).toBe("true");
  });

  it("does not grant CORS to an unrelated origin", async () => {
    const { app } = setup();
    const response = await app.request("/api/health", {
      headers: { Origin: "https://other.test" },
    });
    expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });

  it("rejects anonymous requests to the protected profile", async () => {
    const { app } = setup();
    const response = await app.request("/api/me");
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("passes session cookies to auth and returns only the user's profile", async () => {
    const { app, auth } = setup(session);
    const response = await app.request("/api/me", { headers: { Cookie: "session=example" } });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ user: { id: user.id } });
    expect(JSON.stringify(body)).not.toContain(session.session.token);
    expect(auth.getSession.mock.calls[0]?.[0].get("Cookie")).toBe("session=example");
  });

  it("forwards auth requests without consuming the request body", async () => {
    const { app, auth } = setup();
    const response = await app.request("/api/auth/sign-in/email", {
      method: "POST",
      body: JSON.stringify({ email: user.email, password: "example-password" }),
      headers: { "Content-Type": "application/json" },
    });
    expect(await response.text()).toBe("auth response");
    expect(await auth.handler.mock.calls[0]?.[0].json()).toMatchObject({ email: user.email });
  });

  it("preserves expected HTTP error statuses", async () => {
    const { app } = setup();
    app.get("/forbidden", () => {
      throw new HTTPException(403, { message: "Forbidden" });
    });
    const response = await app.request("/forbidden");
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "Forbidden" });
  });

  it("reports Zod validation errors as 400s", async () => {
    const { app } = setup();
    app.get("/invalid", (c) => c.json(z.object({ name: z.string() }).parse({ name: 42 })));
    const response = await app.request("/invalid");
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: "Validation failed",
      details: [{ path: ["name"] }],
    });
  });

  it("keeps internal error details on the server", async () => {
    const { app, auth } = setup();
    auth.getSession.mockRejectedValue(new Error("postgres://admin:secret@database"));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await app.request("/api/me");
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toEqual({
      error: "Internal Server Error",
      requestId: response.headers.get("X-Request-Id"),
    });
    expect(JSON.stringify(body)).not.toContain("secret");
    expect(log).toHaveBeenCalledOnce();
  });

  it("logs a request ID and route pattern without auth tokens or query values", async () => {
    const { app } = setup();
    const log = vi.spyOn(console, "info").mockImplementation(() => {});
    const response = await app.request(
      "/api/auth/reset-password/private-path-token?token=private-query-token",
    );
    expect(log).toHaveBeenCalledOnce();
    const entry = JSON.parse(String(log.mock.calls[0]?.[0]));
    expect(entry).toMatchObject({
      requestId: response.headers.get("X-Request-Id"),
      route: "/api/auth/*",
      status: 200,
    });
    expect(JSON.stringify(entry)).not.toContain("private-path-token");
    expect(JSON.stringify(entry)).not.toContain("private-query-token");
  });
});
