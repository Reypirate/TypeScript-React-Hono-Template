import { serveStatic } from "hono/bun";

import { createApp } from "./app";
import { createAuth } from "./auth";
import { db } from "./db";
import { env } from "./env";
import { sendMail } from "./mailer";

const auth = createAuth(env, db, sendMail);
const { app } = createApp({
  env,
  auth: {
    handler: (request) => auth.handler(request),
    getSession: (headers) => auth.api.getSession({ headers }),
  },
});

if (env.NODE_ENV === "production") {
  app.use("/*", serveStatic({ root: env.STATIC_ROOT }));
  app.get("*", serveStatic({ path: `${env.STATIC_ROOT}/index.html` }));
}

export type { ApiRoutes } from "./app";

export default {
  fetch: app.fetch,
  port: env.PORT,
};
