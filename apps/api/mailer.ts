import { createTransport, type SendMailOptions } from "nodemailer";
import { env } from "./env";

function getSmtpConfig() {
  const { SMTP_FROM, SMTP_HOST, SMTP_PASS, SMTP_PORT, SMTP_SECURE, SMTP_USER } = env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_FROM) {
    return null;
  }

  return {
    defaults: {
      from: SMTP_FROM,
    },
    transport: {
      auth:
        SMTP_USER && SMTP_PASS
          ? {
              pass: SMTP_PASS,
              user: SMTP_USER,
            }
          : undefined,
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
    },
  };
}

const smtpConfig = getSmtpConfig();

export const mailer = smtpConfig
  ? createTransport(smtpConfig.transport, smtpConfig.defaults)
  : null;

export async function sendMail(message: SendMailOptions) {
  if (!mailer) {
    console.warn("SMTP is not configured; skipping outbound email.");
    return;
  }

  await mailer.sendMail(message);
}
