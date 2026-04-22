import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { env } from "./env";
import { auth } from "./auth";

const app = new Hono();

// Global Middleware
app.use("*", logger());
app.use("*", cors());
app.use("*", secureHeaders());

// Error Handling
app.onError((err, c) => {
  console.error(`[API Error] ${err.message}`, err.stack);
  return c.json(
    {
      success: false,
      message: err.message || "Internal Server Error",
    },
    500
  );
});

// Better Auth Route Handler
app.on(["POST", "GET"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});

// Runtime.js endpoint
app.get("/api/runtime.js", (c) => {
  const clientEnv = Object.fromEntries(
    Object.entries(process.env).filter(([key]) => key.startsWith("VITE_"))
  );
  return c.text(
    `window.__env = ${JSON.stringify(clientEnv, null, 2)}`,
    200,
    { "Content-Type": "application/javascript" }
  );
});

// Health check
app.get("/api/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API Routes
const apiRoutes = app
  .basePath("/api")
  .get("/info", (c) => c.json({ message: "TypeScript React Hono Template" }));

export type ApiRoutes = typeof apiRoutes;

const port = parseInt(env.PORT);
console.log(`Server is running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
