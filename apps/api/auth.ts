import type { SendMailOptions } from "nodemailer";
import type { createDb } from "@repo/db";
import type { ServerEnv } from "./env-config";

import * as schema from "@repo/db/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { openAPI } from "better-auth/plugins";

export function createAuth(
  env: ServerEnv,
  db: ReturnType<typeof createDb>,
  sendMail: (message: SendMailOptions) => Promise<void>,
) {
  const hasMailer = Boolean(env.SMTP_HOST && env.SMTP_PORT && env.SMTP_FROM);

  return betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      ...schema,
    },
  }),
  telemetry: {
    enabled: false,
  },
  emailAndPassword: {
    enabled: true,
    ...(hasMailer
      ? {
          sendResetPassword: async ({ user, url }) => {
            await sendMail({
              to: user.email,
              subject: "Reset your password",
              text: `Click the link to reset your password: ${url}`,
            });
          },
        }
      : {}),
  },
  ...(hasMailer
    ? {
        emailVerification: {
          sendVerificationEmail: async ({ user, url }) => {
            await sendMail({
              to: user.email,
              subject: "Verify your email",
              text: `Click the link to verify your email: ${url}`,
            });
          },
        },
      }
    : {}),
  plugins: [
    openAPI({
      path: "/docs",
    }),
  ],
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL ?? `${env.VITE_API_URL}/api/auth`,
  basePath: "/api/auth",
  trustedOrigins: [new URL(env.VITE_APP_URL).origin, new URL(env.VITE_API_URL).origin],
  rateLimit: {
    enabled: true,
    window: 60,
    max: 20,
    storage: "memory",
  },
  });
}

export type AuthSession = ReturnType<typeof createAuth>["$Infer"]["Session"];
