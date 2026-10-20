# API

[Documentation index](README.md)

The local API runs at `http://localhost:4001`. During development, Vite also proxies `/api`
requests from `http://localhost:4000` to the API. Production serves the API and frontend
from the Bun server.

## Interactive references

| URL                                                     | Contents                                                       |
| ------------------------------------------------------- | -------------------------------------------------------------- |
| [`/api/scalar`](http://localhost:4001/api/scalar)       | Scalar UI for the application API                              |
| [`/api/openapi`](http://localhost:4001/api/openapi)     | OpenAPI 3.1 JSON for `/api/me`, `/api/health`, and `/api/info` |
| [`/api/auth/docs`](http://localhost:4001/api/auth/docs) | Better Auth's generated authentication reference               |

The application specification is maintained explicitly in
[`apps/api/openapi.ts`](../apps/api/openapi.ts). It is separate from Better Auth's generated
reference. Scalar loads its browser script from jsDelivr, so its interactive UI needs access
to that CDN even when the JSON specification is available locally.

## Application endpoints

Routes are defined in [`apps/api/app.ts`](../apps/api/app.ts).

| Method | Path              | Session           | Response                                      |
| ------ | ----------------- | ----------------- | --------------------------------------------- |
| `GET`  | `/health`         | Public            | Liveness status and ISO timestamp             |
| `GET`  | `/api/health`     | Public            | Same liveness response                        |
| `GET`  | `/api/info`       | Public            | Template message and stack names              |
| `GET`  | `/api/me`         | Required          | Current user profile                          |
| `GET`  | `/api/runtime.js` | Public            | Browser configuration as JavaScript, uncached |
| `GET`  | `/api/openapi`    | Public            | Application OpenAPI document                  |
| `GET`  | `/api/scalar`     | Public            | API reference HTML                            |
| Any    | `/api/auth/*`     | Endpoint-specific | Delegated to Better Auth                      |

### Health

```bash
curl http://localhost:4001/api/health
```

```json
{
  "status": "ok",
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

The timestamp above is illustrative. Health checks confirm that the HTTP server responds;
they do not query PostgreSQL, SMTP, or object storage.

### Current user

`GET /api/me` reads the session cookie and returns `{ "user": ... }` with the public user
fields: `id`, `name`, `email`, `emailVerified`, `image`, `createdAt`, and `updatedAt`.
Dates are serialized as JSON strings. The response omits the session token and password.
Both successful and unauthorized responses have `Cache-Control: no-store`.

The existing typed frontend client includes credentials:

```typescript
import { api } from "@/lib/api";

async function loadCurrentUser() {
  const response = await api.me.$get();
  if (!response.ok) throw new Error("A valid session is required");
  return response.json();
}
```

### Runtime configuration

`GET /api/runtime.js` returns `application/javascript; charset=utf-8` and
`Cache-Control: no-store`. For local defaults its body is equivalent to:

```javascript
window.__env = {
  VITE_APP_URL: "http://localhost:4000",
  VITE_API_URL: "http://localhost:4001",
};
```

Only these two keys are exposed. See [runtime configuration](ARCHITECTURE.md#runtime-configuration)
for browser fallback order and how to add a setting.

## Authentication

[`apps/api/auth.ts`](../apps/api/auth.ts) configures Better Auth with email/password
authentication and the Drizzle PostgreSQL adapter. Use the React client from
[`apps/web/src/lib/auth.ts`](../apps/web/src/lib/auth.ts) for signup, signin, signout, and
session state. Browsers must include credentials when calling protected endpoints.

| Method | Path                               | Purpose                                                   |
| ------ | ---------------------------------- | --------------------------------------------------------- |
| `POST` | `/api/auth/sign-up/email`          | Create an account using `name`, `email`, and `password`   |
| `POST` | `/api/auth/sign-in/email`          | Sign in using `email` and `password`                      |
| `POST` | `/api/auth/sign-out`               | Revoke the current session                                |
| `GET`  | `/api/auth/get-session`            | Read the current session, or `null` when anonymous        |
| `GET`  | `/api/auth/verify-email`           | Consume the token in a verification email                 |
| `POST` | `/api/auth/request-password-reset` | Request an email using `email` and a trusted `redirectTo` |
| `POST` | `/api/auth/reset-password`         | Set `newPassword` using a reset `token`                   |

Verification emails on signup and password reset delivery require `SMTP_HOST`, `SMTP_PORT`,
and `SMTP_FROM`. SMTP credentials are used when both username and password are supplied.
The starter does not require verified email before signin or provide a reset-password UI.
Use the running auth reference for complete request schemas and error codes.

Cookie names and attributes are managed by Better Auth; let the browser and auth client
handle them. Requests must satisfy Better Auth's origin and CSRF checks. Public app and API
origins are trusted from configuration. Rate-limited auth requests return `429`; the
integration suite verifies the `X-Retry-After` header. CORS permission alone is not session
authorization.

## Errors and response headers

The application error handler is defined in [`errors.ts`](../apps/api/errors.ts).
Better Auth handles its own error bodies and codes; clients should use its documented
responses rather than assuming every auth error matches the application examples below.

| Status | Application response                                                                                                      |
| ------ | ------------------------------------------------------------------------------------------------------------------------- |
| `400`  | `{ "error": "Validation failed", "details": [{ "path": ["name"], "message": "..." }] }` for a thrown Zod validation error |
| `401`  | `{ "error": "Unauthorized" }` when `/api/me` has no valid session                                                         |
| `404`  | `{ "error": "Not Found" }` for unknown API paths                                                                          |
| `500`  | `{ "error": "Internal Server Error", "requestId": "..." }` for unexpected errors                                          |

Expected Hono `HTTPException` errors retain their status and return the exception message
under `error`. Internal exception details stay in server logs.

Responses carry `X-Request-Id`, which credentialed CORS exposes to the browser. Supply that
ID when investigating failures. API routes are handled before production static serving,
so a missing API endpoint returns JSON rather than the SPA's HTML.

## Extending the API

1. Add application endpoints to the chain in `createApiRoutes` so the exported `ApiRoutes`
   type and Hono RPC client include them.
2. Apply `createRequireSession` to protected routes and read the verified user from Hono
   context. Add resource authorization for application-owned data.
3. Parse untrusted inputs with a schema; share browser-safe contracts in `@repo/shared`.
4. Update `createOpenApiDocument` and this guide alongside route changes. Register routes
   before the API catch-all handlers.
5. Cover HTTP behavior in `apps/api/app.test.ts`, and add database integration tests when
   behavior depends on real sessions, queries, or migrations. See [Testing](TESTING.md).
