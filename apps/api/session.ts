import type { AuthSession } from "./auth";

import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";

export type ApiEnv = { Variables: { user: AuthSession["user"] } };
export type GetSession = (headers: Headers) => Promise<AuthSession | null>;

export function createRequireSession(getSession: GetSession) {
  return createMiddleware<ApiEnv>(async (c, next) => {
    c.header("Cache-Control", "no-store");
    const session = await getSession(c.req.raw.headers);

    if (!session) {
      throw new HTTPException(401, { message: "Unauthorized" });
    }

    c.set("user", session.user);
    await next();
  });
}
