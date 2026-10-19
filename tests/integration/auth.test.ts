import { createApp } from "../../apps/api/app";
import { createAuth } from "../../apps/api/auth";
import { createServerEnv } from "../../apps/api/env-config";
import { createDb, eq, schema, sql } from "../../packages/db";
import { migrateDb } from "../../packages/db/migrations";

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "bun:test";

// This is intentionally independent of DATABASE_URL and the user's application data.
const databaseUrl =
  process.env.TEST_DATABASE_URL ?? "postgres://postgres:password@localhost:5433/app_test";
const databaseName = `template_test_${crypto.randomUUID().replaceAll("-", "")}`;
const isolatedUrl = new URL(databaseUrl);
isolatedUrl.pathname = `/${databaseName}`;
const admin = createDb(databaseUrl, { max: 1 });
const db = createDb(isolatedUrl.toString(), { max: 1 });
let databaseCreated = false;
const env = createServerEnv({
  NODE_ENV: "test",
  DATABASE_URL: isolatedUrl.toString(),
  BETTER_AUTH_SECRET: "integration-test-only-secret-at-least-32-characters",
});
const auth = createAuth(env, db, () => Promise.resolve());
const { app } = createApp({
  env,
  auth: {
    handler: (request) => auth.handler(request),
    getSession: (headers) => auth.api.getSession({ headers }),
  },
});

let clientNumber = 0;
let clientIp = "198.51.100.1";
beforeEach(() => {
  clientIp = `198.51.100.${++clientNumber}`;
});

function requestAuth(path: string, body: Record<string, string>, cookie?: string, target = app) {
  return target.request(`${env.VITE_API_URL}/api/auth/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: env.VITE_APP_URL,
      "X-Forwarded-For": clientIp,
      "Sec-Fetch-Site": "same-site",
      "Sec-Fetch-Mode": "cors",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: JSON.stringify(body),
  });
}

beforeAll(async () => {
  try {
    await admin.execute(sql`create database ${sql.identifier(databaseName)}`);
    databaseCreated = true;
  } catch (cause) {
    throw new Error(
      "Cannot create the integration database. Run pnpm services:test and use a TEST_DATABASE_URL role with CREATEDB permission.",
      { cause },
    );
  }
  await migrateDb(db);
});

afterAll(async () => {
  await db.$client.end();
  try {
    if (databaseCreated) {
      await admin.execute(sql`drop database ${sql.identifier(databaseName)}`);
    }
  } finally {
    await admin.$client.end();
  }
});

describe("database and Better Auth integration", () => {
  it("reapplies migrations without changing the schema", async () => {
    await migrateDb(db);
    expect(await db.select().from(schema.user)).toEqual([]);
  });

  it("signs up, signs in, authorizes a cookie, and revokes it on sign-out", async () => {
    const credentials = { email: "ada@example.com", password: "correct-horse-battery-staple" };
    const signup = await requestAuth("sign-up/email", { ...credentials, name: "Ada Lovelace" });
    expect(signup.status).toBe(200);
    const [storedUser] = await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.email, credentials.email));
    expect(storedUser?.name).toBe("Ada Lovelace");
    const [account] = await db
      .select()
      .from(schema.account)
      .where(eq(schema.account.userId, storedUser.id));
    expect(account?.password).toBeTruthy();
    expect(account?.password).not.toBe(credentials.password);

    const signin = await requestAuth("sign-in/email", credentials);
    expect(signin.status).toBe(200);
    const cookie = signin.headers
      .getSetCookie()
      .map((value) => value.split(";")[0])
      .join("; ");
    expect(cookie).toContain("better-auth.session_token=");

    const profile = await app.request("/api/me", { headers: { Cookie: cookie } });
    expect(profile.status).toBe(200);
    expect(await profile.json()).toMatchObject({ user: { email: credentials.email } });

    const signout = await requestAuth("sign-out", {}, cookie);
    expect(signout.status).toBe(200);
    expect((await app.request("/api/me", { headers: { Cookie: cookie } })).status).toBe(401);
  });

  it("rejects a sign-up from an untrusted origin", async () => {
    const response = await app.request(`${env.VITE_API_URL}/api/auth/sign-up/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://untrusted.test",
        "X-Forwarded-For": clientIp,
        "Sec-Fetch-Site": "cross-site",
        "Sec-Fetch-Mode": "cors",
      },
      body: JSON.stringify({
        name: "Other",
        email: "other@example.com",
        password: "example-password",
      }),
    });
    expect(response.status).toBe(403);
    expect(
      await db.select().from(schema.user).where(eq(schema.user.email, "other@example.com")),
    ).toEqual([]);
  });

  it("rejects incorrect passwords without creating a session", async () => {
    const email = "wrong-password@example.com";
    expect(
      (
        await requestAuth("sign-up/email", {
          email,
          name: "Wrong Password",
          password: "original-password",
        })
      ).status,
    ).toBe(200);
    const response = await requestAuth("sign-in/email", { email, password: "incorrect-password" });
    expect(response.status).toBe(401);
    expect(response.headers.get("Set-Cookie")).toBeNull();
  });

  it("rate limits repeated auth requests from the same client IP", async () => {
    for (let attempt = 0; attempt <= 20; attempt += 1) {
      // These requests must be sequential so each increments the rate-limit counter.
      // oxlint-disable-next-line no-await-in-loop
      const response = await app.request("/api/auth/get-session", {
        headers: { "X-Forwarded-For": "192.0.2.10" },
      });
      expect(response.status).toBe(attempt < 20 ? 200 : 429);
      if (attempt === 20) expect(Number(response.headers.get("X-Retry-After"))).toBeGreaterThan(0);
    }
  });

  it("rejects expired and tampered session cookies", async () => {
    const response = await requestAuth("sign-up/email", {
      email: "expired@example.com",
      name: "Expired",
      password: "example-password",
    });
    expect(response.status).toBe(200);
    const cookie = response.headers
      .getSetCookie()
      .map((value) => value.split(";")[0])
      .join("; ");
    expect(cookie).toContain("better-auth.session_token=");
    const body = (await response.json()) as { user: { id: string } };
    await db
      .update(schema.session)
      .set({ expiresAt: new Date(Date.now() - 60_000) })
      .where(eq(schema.session.userId, body.user.id));
    expect((await app.request("/api/me", { headers: { Cookie: cookie } })).status).toBe(401);
    expect(
      (await app.request("/api/me", { headers: { Cookie: `${cookie}tampered` } })).status,
    ).toBe(401);
  });

  it("enforces cascading deletion of accounts and sessions", async () => {
    const response = await requestAuth("sign-up/email", {
      email: "cascade@example.com",
      name: "Cascade",
      password: "example-password",
    });
    expect(response.status).toBe(200);
    const body = (await response.json()) as { user: { id: string } };
    await db.delete(schema.user).where(eq(schema.user.id, body.user.id));
    expect(
      await db.select().from(schema.account).where(eq(schema.account.userId, body.user.id)),
    ).toEqual([]);
    expect(
      await db.select().from(schema.session).where(eq(schema.session.userId, body.user.id)),
    ).toEqual([]);
  });

  it("verifies an email and resets the password using the generated email links", async () => {
    const messages: Parameters<Parameters<typeof createAuth>[2]>[0][] = [];
    const mailAuth = createAuth(
      { ...env, SMTP_HOST: "localhost", SMTP_PORT: 1025, SMTP_FROM: "template@example.com" },
      db,
      (message) => {
        messages.push(message);
        return Promise.resolve();
      },
    );
    const { app: mailApp } = createApp({
      env,
      auth: {
        handler: (request) => mailAuth.handler(request),
        getSession: (headers) => mailAuth.api.getSession({ headers }),
      },
    });
    const email = "mail-flow@example.com";
    expect(
      (
        await requestAuth(
          "sign-up/email",
          { email, name: "Mail Flow", password: "original-password" },
          undefined,
          mailApp,
        )
      ).status,
    ).toBe(200);
    const verificationMessage = messages.find((message) => message.subject === "Verify your email");
    expect(verificationMessage?.to).toBe(email);
    const verificationUrl = String(verificationMessage?.text).match(/https?:\/\/\S+/u)?.[0];
    expect(verificationUrl).toBeTruthy();
    expect((await mailApp.request(String(verificationUrl))).status).toBeLessThan(400);
    const [verifiedUser] = await db.select().from(schema.user).where(eq(schema.user.email, email));
    expect(verifiedUser.emailVerified).toBe(true);

    expect(
      (
        await requestAuth(
          "request-password-reset",
          { email, redirectTo: `${env.VITE_APP_URL}/reset-password` },
          undefined,
          mailApp,
        )
      ).status,
    ).toBe(200);
    const resetMessage = messages.find((message) => message.subject === "Reset your password");
    expect(resetMessage?.to).toBe(email);
    const resetUrl = String(resetMessage?.text).match(/https?:\/\/\S+/u)?.[0];
    const token = new URL(String(resetUrl)).pathname.split("/").at(-1) ?? "";
    expect(token).not.toBe("");
    expect(
      (
        await requestAuth(
          "reset-password",
          { token, newPassword: "replacement-password" },
          undefined,
          mailApp,
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await requestAuth(
          "sign-in/email",
          { email, password: "original-password" },
          undefined,
          mailApp,
        )
      ).status,
    ).toBe(401);
    expect(
      (
        await requestAuth(
          "sign-in/email",
          { email, password: "replacement-password" },
          undefined,
          mailApp,
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await requestAuth(
          "reset-password",
          { token, newPassword: "another-password" },
          undefined,
          mailApp,
        )
      ).status,
    ).toBe(400);
  });
});
