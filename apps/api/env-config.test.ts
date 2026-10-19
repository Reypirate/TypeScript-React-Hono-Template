import { afterEach, describe, expect, it, vi } from "vitest";

import { createServerEnv } from "./env-config";

const required = {
  DATABASE_URL: "postgres://postgres:password@localhost:5432/app",
  BETTER_AUTH_SECRET: "unit-test-secret-with-at-least-32-characters",
};

afterEach(() => vi.restoreAllMocks());

describe("server environment", () => {
  it("parses false strings as false", () => {
    const env = createServerEnv({ ...required, SMTP_SECURE: "false", FORCE_PATH_STYLE: "false" });
    expect(env.SMTP_SECURE).toBe(false);
    expect(env.FORCE_PATH_STYLE).toBe(false);
  });

  it("parses true strings and supplies defaults for empty optional values", () => {
    const env = createServerEnv({ ...required, SMTP_SECURE: "true", FORCE_PATH_STYLE: "" });
    expect(env.SMTP_SECURE).toBe(true);
    expect(env.FORCE_PATH_STYLE).toBe(true);
    expect(env.PORT).toBe(4001);
  });

  it.each([
    { SMTP_SECURE: "no" },
    { PORT: "0" },
    { PORT: "65536" },
    { SMTP_PORT: "1.5" },
    { AWS_S3_ENDPOINT: "not-a-url" },
    { BETTER_AUTH_SECRET: "too-short" },
    { DATABASE_URL: undefined, CI: "true" },
  ])("rejects invalid configuration: %j", (overrides) => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => createServerEnv({ ...required, ...overrides })).toThrow();
  });
});
