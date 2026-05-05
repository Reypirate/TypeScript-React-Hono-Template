import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  client: {
    VITE_APP_URL: z.string().url().default("http://localhost:4000"),
    VITE_API_URL: z.string().url().default("http://localhost:4001"),
  },
  server: {
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    DATABASE_URL: z.string().url(),
    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_URL: z.string().url().optional(),
    PORT: z.coerce.number().default(4001),
    STATIC_ROOT: z.string().default("apps/web/dist"),
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().optional(),
    SMTP_SECURE: z.coerce.boolean().default(false),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    SMTP_FROM: z.string().optional(),
    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),
    AWS_REGION: z.string().optional(),
    AWS_S3_ENDPOINT: z.string().optional(),
    AWS_S3_BUCKET: z.string().optional(),
    FORCE_PATH_STYLE: z.coerce.boolean().default(true),
  },
  clientPrefix: "VITE_",
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
  skipValidation: Boolean(process.env.CI) || process.env.npm_lifecycle_event === "lint",
});

export type ClientEnv = {
  [K in keyof typeof env as K extends `VITE_${string}` ? K : never]: string;
};
