import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

const booleanString = z.enum(["true", "false"]).transform((value) => value === "true");
const port = z.coerce.number().int().min(1).max(65535);

export function createServerEnv(runtimeEnv: Record<string, string | undefined>) {
  return createEnv({
    client: {
      VITE_APP_URL: z.url().default("http://localhost:4000"),
      VITE_API_URL: z.url().default("http://localhost:4001"),
    },
    server: {
      NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
      DATABASE_URL: z.url(),
      BETTER_AUTH_SECRET: z.string().min(32),
      BETTER_AUTH_URL: z.url().optional(),
      PORT: port.default(4001),
      STATIC_ROOT: z.string().default("apps/web/dist"),
      SMTP_HOST: z.string().optional(),
      SMTP_PORT: port.optional(),
      SMTP_SECURE: booleanString.default(false),
      SMTP_USER: z.string().optional(),
      SMTP_PASS: z.string().optional(),
      SMTP_FROM: z.string().optional(),
      AWS_ACCESS_KEY_ID: z.string().optional(),
      AWS_SECRET_ACCESS_KEY: z.string().optional(),
      AWS_REGION: z.string().optional(),
      AWS_S3_ENDPOINT: z.url().optional(),
      AWS_S3_BUCKET: z.string().optional(),
      FORCE_PATH_STYLE: booleanString.default(true),
    },
    clientPrefix: "VITE_",
    runtimeEnv,
    emptyStringAsUndefined: true,
  });
}

export type ServerEnv = ReturnType<typeof createServerEnv>;
export type ClientEnv = Pick<ServerEnv, "VITE_APP_URL" | "VITE_API_URL">;
