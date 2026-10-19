import { afterAll, beforeAll, describe, expect, it } from "bun:test";

import { createApp } from "../../apps/api/app";
import { createAuth } from "../../apps/api/auth";
import { createServerEnv } from "../../apps/api/env-config";
import { createDb, eq, schema, sql } from "../../packages/db";
import { migrateDb } from "../../packages/db/migrations";

// This is intentionally independent of DATABASE_URL and the user's application data.
const databaseUrl = process.env.TEST_DATABASE_URL ?? "postgres://postgres:password@localhost:5433/app_test";
const schemaName = `test_${crypto.randomUUID().replaceAll("-", "")}`;
const admin = createDb(databaseUrl, { max: 1 });
const db = createDb(databaseUrl, { max: 1, connection: { search_path: schemaName } });
const env = createServerEnv({
  NODE_ENV: "test",
  DATABASE_URL: databaseUrl,
  BETTER_AUTH_SECRET: "integration-test-only-secret-at-least-32-characters",
});
const auth = createAuth(env, db, async () => {});
const { app } = createApp({
  env,
  auth: {
    handler: (request) => auth.handler(request),
    getSession: (headers) => auth.api.getSession({ headers }),
  },
});

function requestAuth(path: string, body: Record<string, string>, cookie?: string) {
  return app.request(`${env.VITE_API_URL}/api/auth/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: env.VITE_APP_URL,
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: JSON.stringify(body),
  });
}

beforeAll(async () => {
  await admin.execute(sql`create schema ${sql.identifier(schemaName)}`);
  await migrateDb(db, schemaName);
});

afterAll(async () => {
  await db.$client.end();
  try {
    await admin.execute(sql`drop schema if exists ${sql.identifier(schemaName)} cascade`);
  } finally {
    await admin.$client.end();
  }
});

describe("database and Better Auth integration", () => {
  it("reapplies migrations without changing the schema", async () => {
    await migrateDb(db, schemaName);
    expect(await db.select().from(schema.user)).toEqual([]);
  });

  it("signs up, signs in, authorizes a cookie, and revokes it on sign-out", async () => {
    const credentials = { email: "ada@example.com", password: "correct-horse-battery-staple" };
    const signup = await requestAuth("sign-up/email", { ...credentials, name: "Ada Lovelace" });
    expect(signup.status).toBe(200);
    const [storedUser] = await db.select().from(schema.user).where(eq(schema.user.email, credentials.email));
    expect(storedUser?.name).toBe("Ada Lovelace");
    const [account] = await db.select().from(schema.account).where(eq(schema.account.userId, storedUser.id));
    expect(account?.password).toBeTruthy();
    expect(account?.password).not.toBe(credentials.password);

    const signin = await requestAuth("sign-in/email", credentials);
    expect(signin.status).toBe(200);
    const cookie = signin.headers.getSetCookie().map((value) => value.split(";")[0]).join("; ");
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
      headers: { "Content-Type": "application/json", Origin: "https://untrusted.test" },
      body: JSON.stringify({ name: "Other", email: "other@example.com", password: "example-password" }),
    });
    expect(response.status).toBe(403);
    expect(await db.select().from(schema.user).where(eq(schema.user.email, "other@example.com"))).toEqual([]);
  });
});
