const document = {
  openapi: "3.1.0",
  info: {
    title: "TypeScript React Hono API",
    version: "1.0.0",
    description: "API documentation for the monorepo React and Hono template.",
  },
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

export function createOpenApiDocument(apiUrl: string) {
  return { ...document, servers: [{ url: apiUrl, description: "Configured API server" }] };
}

export const scalarDocument = `<!doctype html>
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
