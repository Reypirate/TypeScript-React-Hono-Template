import * as schema from "@repo/db/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { openAPI } from "better-auth/plugins";

import { db } from "./db";
import { env } from "./env";
import { sendMail } from "./mailer";

const hasMailer = Boolean(env.SMTP_HOST && env.SMTP_PORT && env.SMTP_FROM);

export const auth = betterAuth({
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
});
