import type { ClientEnv } from "./env-config";
import type { ApiEnv, GetSession } from "./session";

import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import { ZodError } from "zod";

import { createRequireSession } from "./session";

type AppOptions = {
  env: ClientEnv;
  auth: {
    handler: (request: Request) => Promise<Response>;
    getSession: GetSession;
  };
};

export function createApp({ env, auth }: AppOptions) {
const app = new Hono<ApiEnv>();
const requireSession = createRequireSession(auth.getSession);

app.use("*", requestId());
app.use("*", logger());
app.use(
  "*",
  cors({
    credentials: true,
    origin: [new URL(env.VITE_APP_URL).origin, new URL(env.VITE_API_URL).origin],
    exposeHeaders: ["X-Request-Id"],
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
    "/api/me": {
      get: {
        summary: "Current authenticated user",
        security: [{ sessionCookie: [] }],
        responses: {
          "200": { description: "Returns the current user's public profile." },
          "401": { description: "A valid session is required." },
        },
      },
    },
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
  components: {
    securitySchemes: {
      sessionCookie: { type: "apiKey", in: "cookie", name: "better-auth.session_token" },
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

app.all("/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});

app.get("/api/runtime.js", (c) => {
  const clientEnv = { VITE_APP_URL: env.VITE_APP_URL, VITE_API_URL: env.VITE_API_URL };

  return c.text(`window.__env = ${JSON.stringify(clientEnv, null, 2)};`, 200, {
    "Content-Type": "application/javascript; charset=utf-8",
    "Cache-Control": "no-store",
  });
});

app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

const apiRoutes = new Hono<ApiEnv>()
  .basePath("/api")
  .get("/me", requireSession, (c) => c.json({ user: c.get("user") }))
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

app.all("/api", (c) => c.json({ error: "Not Found" }, 404));
app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));
app.notFound((c) => c.json({ error: "Not Found" }, 404));

app.onError((err, c) => {
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
});

return { app, apiRoutes };
}

export type ApiRoutes = ReturnType<typeof createApp>["apiRoutes"];
