# Deployment

[Documentation index](README.md)

Production uses one Bun process for the API and the compiled React app. PostgreSQL is an
external service. SMTP and S3-compatible storage are optional integrations. The supplied
Compose file is for local development infrastructure; the application image is built with
the root [`Dockerfile`](../Dockerfile).

## Build and startup

From a source checkout with the pinned tools and frozen dependencies:

```bash
pnpm install --frozen-lockfile
pnpm build
```

Build outputs are `apps/api/dist/index.js` with its source map and the Vite assets in
`apps/web/dist`. Build commands do not apply database migrations.

After configuring the environment and applying migrations, run:

```bash
pnpm start
```

This loads the root `.env`, switches to the repository root, and forces production mode
through [`scripts/start.mjs`](../scripts/start.mjs). For a host deployment, provide the
production environment through the process manager or the root `.env` and start from the
repository root. Manage process restarts and logs with your hosting platform.

## Environment

[`apps/api/env-config.ts`](../apps/api/env-config.ts) validates environment values when the
server starts. Empty strings become undefined. Ports must be integers from 1 to 65535;
boolean settings accept the strings `true` or `false`.

| Variable             | Default / requirement                               | Purpose                                                  |
| -------------------- | --------------------------------------------------- | -------------------------------------------------------- |
| `DATABASE_URL`       | Required URL                                        | PostgreSQL connection accessible from the server         |
| `BETTER_AUTH_SECRET` | Required, at least 32 characters                    | Persistent random secret for authentication              |
| `NODE_ENV`           | `development`; production startup sets `production` | Enables static web serving                               |
| `PORT`               | `4001`                                              | Server listening port                                    |
| `STATIC_ROOT`        | `apps/web/dist`                                     | Web build path relative to the working directory         |
| `VITE_APP_URL`       | `http://localhost:4000`; set for deployment         | Public frontend URL and trusted origin                   |
| `VITE_API_URL`       | `http://localhost:4001`; set for deployment         | Public API URL, RPC/auth client base, and trusted origin |
| `BETTER_AUTH_URL`    | `${VITE_API_URL}/api/auth`                          | Public authentication base URL                           |

For the default deployment, serve the frontend and API from the same HTTPS origin. Set
both public URLs to that origin, without a trailing slash, and set the auth URL to its
`/api/auth` path. Runtime configuration serves only the two public `VITE_*` values to the
browser, so they can change without rebuilding the web assets.

An example production environment file, `.env.production.local`, could contain:

```dotenv
NODE_ENV=production
PORT=4001
STATIC_ROOT=apps/web/dist
DATABASE_URL=postgres://app_user:replace-with-db-password@db:5432/app
BETTER_AUTH_SECRET=replace-with-a-random-secret-of-at-least-32-characters
VITE_APP_URL=https://app.example.com
VITE_API_URL=https://app.example.com
BETTER_AUTH_URL=https://app.example.com/api/auth
```

Replace the placeholders with deployment credentials and reachable hosts. Generate the auth
secret using the command in [Contributing](CONTRIBUTING.md#local-setup) and keep it stable
across restarts and replicas. `.env.production.local` is ignored by Git; supply production
secrets through your deployment platform or a local environment file.

### Optional email

| Variable                              | Requirement / default                                   |
| ------------------------------------- | ------------------------------------------------------- |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM` | All three enable verification and reset email callbacks |
| `SMTP_USER`, `SMTP_PASS`              | Authentication is supplied when both are present        |
| `SMTP_SECURE`                         | `false`; use the value required by the mail provider    |

Use a real mail provider for production. The starter sends verification messages on signup
when mail is configured, but does not require verified email before signin. Password reset
callbacks need an application UI that can accept the emailed token.

### Optional object storage

The Bun S3 client is created only when `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`,
`AWS_REGION`, `AWS_S3_ENDPOINT`, and `AWS_S3_BUCKET` are all present. `FORCE_PATH_STYLE`
defaults to `true` for MinIO-style addressing; `false` selects virtual-hosted addressing.
The helper is available in [`storage.ts`](../apps/api/storage.ts). Upload endpoints and
access policies belong to the application built from this starter.

## Database release step

Apply committed migrations from a source checkout containing the deployment's lockfile and
`packages/db/drizzle` files, with the production `DATABASE_URL` supplied securely:

```bash
pnpm db:check
pnpm db:check-drift
pnpm db:migrate
```

Run this release step once before rolling out the new application. The first two commands
validate files offline; `db:migrate` connects to the configured database and applies pending
migrations. Review generated SQL, arrange backups, and assess compatibility with the
currently running version before applying schema changes.

The production image contains the application bundles, not the Drizzle CLI or migration
directory. Run migrations from a release runner or source checkout rather than from the
runtime container. Server startup does not run them automatically.

The initial migration assumes empty application tables. For a database previously managed
with `db:push`, establish a reviewed baseline against its existing schema before applying
versioned migrations. Use new forward migrations for subsequent schema changes.

## Docker

The build stages use Node 22.23.3, pnpm 10.33.3, and Bun 1.3.13. The final image uses
`oven/bun:1.3.13-alpine`, contains the built API and web assets, and runs as the `bun` user.
The [Docker ignore file](../.dockerignore) excludes local secrets, dependencies, and data
from the build context.

Build from the repository root, then run with the production environment:

```bash
docker build -t react-hono-template:latest .
docker run -d --name react-hono-app --env-file .env.production.local -p 127.0.0.1:4001:4001 react-hono-template:latest
```

This binds the app to host loopback for a reverse proxy on that host. Adapt port publishing
and networking to your platform. `db` in the example environment must resolve on the
container's network; use your managed database hostname, join the appropriate Docker
network, or use `host.docker.internal` for host services on Docker Desktop. `localhost`
inside the application container refers to that container itself.

Inspect server output with `docker logs react-hono-app`. The image exposes port 4001 and
does not declare a Docker `HEALTHCHECK`; configure your platform's probe explicitly.

## Reverse proxy and caching

Terminate HTTPS at your ingress or reverse proxy and route the entire application origin
to the Bun server. Preserve the request host and scheme, and configure trusted forwarding
and client IP handling for the auth rate limiter. Its counters are in memory per process;
multiple replicas require a deliberate rate-limiting strategy.

Keep `/api/*` routed to the API, including `/api/runtime.js`, `/api/auth/*`, and the reference
pages. Respect `Cache-Control: no-store` on runtime configuration and `/api/me`; exclude
authenticated traffic and responses that set session cookies from shared caching.
Frontend deep links must reach the Bun server's SPA fallback.

If using separate frontend and API origins, verify credentialed requests, cookie behavior,
and the configured trusted origins in the deployed browsers. The default same-origin
layout avoids needing additional cross-site cookie configuration.

## Deployment checks

After rollout, verify the public URL:

```bash
curl -i https://app.example.com/api/health
curl -i https://app.example.com/api/runtime.js
curl -i https://app.example.com/api/me
curl -i https://app.example.com/api/does-not-exist
```

Expect health `200` with a timestamp, runtime JavaScript `200` with the deployed public URLs
and `Cache-Control: no-store`, anonymous `/api/me` `401`, and an API JSON `404` for the last
request. The health routes are liveness checks; they do not verify external services.

Open the home page, a frontend deep link, `/api/scalar`, and `/api/auth/docs`. Confirm that
assets load and that signup, signin, signout, and any enabled email flow work against the
deployed database and provider. The local browser suite covers anonymous production
behavior; see [Testing](TESTING.md) for its boundaries.

Release Please creates version and changelog PRs and GitHub releases; it does not deploy the
application. See [CI and releases](CI.md#releases) for setup.
