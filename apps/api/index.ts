import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";

import { auth } from "./auth";
import { env } from "./env";

const app = new Hono();

app.use("*", logger());
app.use(
  "*",
  cors({
    credentials: true,
    origin: [env.VITE_APP_URL, env.VITE_API_URL],
  }),
);
app.use("*", secureHeaders());

const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "TypeScript React Hono API",
    version: "1.0.0",
    description: "API documentation for the monorepo React and Hono template.",
  },
  servers: [
    {
      url: env.VITE_API_URL,
      description: "Configured API server",
    },
  ],
  paths: {
    "/api/health": {
      get: {
        summary: "Health check",
        responses: {
          "200": {
            description: "Returns the health status of the API.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    timestamp: { type: "string", format: "date-time" },
                  },
                  required: ["status", "timestamp"],
                },
              },
            },
          },
        },
      },
    },
    "/api/info": {
      get: {
        summary: "Template metadata",
        responses: {
          "200": {
            description: "Returns basic template metadata.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    stack: {
                      type: "array",
                      items: { type: "string" },
                    },
                  },
                  required: ["message", "stack"],
                },
              },
            },
          },
        },
      },
    },
  },
};

const scalarDocument = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>API Reference</title>
  </head>
  <body>
    <script
      id="api-reference"
      data-url="/api/openapi"
      data-theme="deepSpace"></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>`;

app.on(["POST", "GET"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});

app.get("/api/runtime.js", (c) => {
  const clientEnv = Object.fromEntries(
    Object.entries(env).filter(([key]) => key.startsWith("VITE_")),
  );

  return c.text(`window.__env = ${JSON.stringify(clientEnv, null, 2)};`, 200, {
    "Content-Type": "application/javascript; charset=utf-8",
  });
});

app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

const apiRoutes = new Hono()
  .basePath("/api")
  .get("/health", (c) => {
    return c.json({ status: "ok", timestamp: new Date().toISOString() });
  })
  .get("/info", (c) => {
    return c.json({
      message: "TypeScript React Hono Template",
      stack: ["React", "Hono", "TanStack", "Drizzle", "Turborepo"],
    });
  })
  .get("/openapi", (c) => c.json(openApiDocument))
  .get("/scalar", (c) => c.html(scalarDocument));

app.route("/", apiRoutes);

app.use("/assets/*", serveStatic({ root: env.STATIC_ROOT }));
app.use("/*", serveStatic({ root: env.STATIC_ROOT }));
app.get("*", serveStatic({ path: `${env.STATIC_ROOT}/index.html` }));

app.onError((err, c) => {
  if (err instanceof Error && err.name === "ValidationError") {
    return c.json(
      {
        error: "Validation failed",
        details: err.message,
      },
      400,
    );
  }

  console.error("[API Error]", err);
  return c.json(
    {
      error: "Internal Server Error",
      message: err instanceof Error ? err.message : "Unknown error",
    },
    500,
  );
});

export type ApiRoutes = typeof apiRoutes;

const server = {
  fetch: app.fetch,
  port: env.PORT,
};

console.log(`API is running on http://localhost:${env.PORT}`);

export default server;
