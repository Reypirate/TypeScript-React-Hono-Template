import type { ApiEnv } from "./session";

import { createMiddleware } from "hono/factory";

export const requestLogger = createMiddleware<ApiEnv>(async (c, next) => {
  const startedAt = performance.now();
  await next();
  console.info(
    JSON.stringify({
      requestId: c.get("requestId"),
      method: c.req.method,
      route: c.req.routePath,
      status: c.res.status,
      durationMs: Math.round(performance.now() - startedAt),
    }),
  );
});
