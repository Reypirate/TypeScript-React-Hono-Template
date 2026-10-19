import type { ClientEnv } from "./env-config";
import type { ApiEnv, GetSession } from "./session";

import { Hono } from "hono";
import { cors } from "hono/cors";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";

import { handleError } from "./errors";
import { createOpenApiDocument, scalarDocument } from "./openapi";
import { requestLogger } from "./request-logger";
import { createRequireSession } from "./session";

type AppOptions = {
  env: ClientEnv;
  auth: {
    handler: (request: Request) => Promise<Response>;
    getSession: GetSession;
  };
};

function createApiRoutes(env: ClientEnv, getSession: GetSession) {
  return new Hono<ApiEnv>()
    .basePath("/api")
    .get("/me", createRequireSession(getSession), (c) => c.json({ user: c.get("user") }))
    .get("/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }))
    .get("/info", (c) =>
      c.json({
        message: "TypeScript React Hono Template",
        stack: ["React", "Hono", "TanStack", "Drizzle", "Turborepo"],
      }),
    )
    .get("/openapi", (c) => c.json(createOpenApiDocument(env.VITE_API_URL)))
    .get("/scalar", (c) => c.html(scalarDocument));
}

export function createApp({ env, auth }: AppOptions) {
  const app = new Hono<ApiEnv>();
  app.use("*", requestId());
  app.use("*", requestLogger);
  app.use("*", secureHeaders());
  app.use(
    "*",
    cors({
      credentials: true,
      origin: [new URL(env.VITE_APP_URL).origin, new URL(env.VITE_API_URL).origin],
      exposeHeaders: ["X-Request-Id"],
    }),
  );
  app.all("/api/auth/*", (c) => auth.handler(c.req.raw));
  app.get("/api/runtime.js", (c) => {
    const clientEnv = { VITE_APP_URL: env.VITE_APP_URL, VITE_API_URL: env.VITE_API_URL };
    return c.text("window.__env = " + JSON.stringify(clientEnv) + ";", 200, {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-store",
    });
  });
  app.get("/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));
  const apiRoutes = createApiRoutes(env, auth.getSession);
  app.route("/", apiRoutes);
  app.all("/api", (c) => c.json({ error: "Not Found" }, 404));
  app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));
  app.notFound((c) => c.json({ error: "Not Found" }, 404));
  app.onError(handleError);
  return { app, apiRoutes };
}

export type ApiRoutes = ReturnType<typeof createApp>["apiRoutes"];
