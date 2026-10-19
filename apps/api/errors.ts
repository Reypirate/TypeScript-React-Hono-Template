import type { ApiEnv } from "./session";
import type { ErrorHandler } from "hono";

import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";

export const handleError: ErrorHandler<ApiEnv> = (err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status);
  }

  if (err instanceof ZodError) {
    return c.json(
      {
        error: "Validation failed",
        details: err.issues.map(({ path, message }) => ({ path, message })),
      },
      400,
    );
  }

  console.error(`[API Error] ${c.get("requestId")}`, err);
  return c.json(
    {
      error: "Internal Server Error",
      requestId: c.get("requestId"),
    },
    500,
  );
};
