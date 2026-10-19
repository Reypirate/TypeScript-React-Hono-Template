# TypeScript React Hono Template

A production-minded full-stack TypeScript monorepo with a React 19 frontend, a Hono API,
Better Auth, Drizzle/PostgreSQL, runtime client configuration, API docs, CI, and pnpm/Turbo
workspace orchestration.

## Architecture

```text
.
├── apps/
│   ├── web/                 # React 19, Vite, TanStack Router, TanStack Query
│   └── api/                 # Hono API, Better Auth, runtime env, OpenAPI, static serving
├── packages/
│   ├── db/                  # Drizzle schema and database client
│   ├── shared/              # Shared Zod schemas and cross-stack types
│   └── config/              # Shared TypeScript config
├── pnpm-workspace.yaml      # Workspaces and dependency catalogs
├── turbo.json               # Build, test, lint, typecheck orchestration
└── Dockerfile               # Monorepo build, Bun production server
```

## Getting Started

Prerequisites:

- Node.js 22.18+
- pnpm 10.33+
- Bun 1.3+
- Docker Desktop (running) for PostgreSQL and the local services

```bash
pnpm install
cp .env.example .env
```

In PowerShell, use `Copy-Item .env.example .env`. Generate a random auth secret and paste it
into `BETTER_AUTH_SECRET` in `.env` (at least 32 characters):

```bash
bun -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
pnpm services:up
pnpm db:migrate
pnpm dev
```

Development servers:

- Web: http://localhost:4000
- API: http://localhost:4001
- API docs: http://localhost:4001/api/scalar
- Health: http://localhost:4001/api/health

## Runtime Configuration

The API serves an uncached `/api/runtime.js`, which exposes only `VITE_APP_URL` and
`VITE_API_URL` to the browser:

```html
<script type="text/javascript" src="/api/runtime.js"></script>
```

This keeps the frontend container-friendly: build once, then deploy with different runtime
environment values.

## Scripts

- `pnpm dev` - run all workspace dev servers through Turbo
- `pnpm build` - build the web app and bundled API
- `pnpm start` - run the production API bundle, which also serves `apps/web/dist`
- `pnpm lint` - run oxlint
- `pnpm format` - write formatting changes with oxfmt
- `pnpm format:check` - check formatting in CI
- `pnpm typecheck` - typecheck workspace packages
- `pnpm test` - run Vitest workspace tests
- `pnpm check` - formatting, lint, types, unit tests, and production build
- `pnpm test:integration` - real PostgreSQL and Better Auth integration tests
- `pnpm test:e2e` - build and test the production app in Chromium
- `pnpm db:generate` - generate versioned SQL migrations after schema changes
- `pnpm db:migrate` - apply committed migrations using `.env`
- `pnpm db:check` - validate migration history
- `pnpm db:check-drift` - detect schema changes without committed migrations
- `pnpm db:push` - push Drizzle schema using `.env`
- `pnpm db:studio` - open Drizzle Studio using `.env`

## Local Services

`docker-compose.yaml` includes PostgreSQL, MailDev, and MinIO. They support the optional
database, email, and S3-compatible storage settings in `.env.example`.

Use `pnpm services:up` to start development services and initialize the MinIO bucket.
Use `pnpm services:test` for a separate PostgreSQL test service on port 5433.

## Production

```bash
pnpm build
pnpm start
```

The Hono server serves API routes under `/api/*`, Better Auth under `/api/auth/*`, runtime
client env at `/api/runtime.js`, and the built React app from `apps/web/dist` when
`NODE_ENV=production`. `pnpm start` sets production mode even when `.env` came from the
development example. Apply migrations before deploying a release.

Docker:

```bash
docker build -t react-hono-template .
docker run --env-file .env -e NODE_ENV=production -p 4001:4001 react-hono-template
```

For Docker, configure `DATABASE_URL` and optional SMTP/S3 endpoints so they are reachable
from the container. On Docker Desktop, host services can use `host.docker.internal`.
Set the public app/API/auth URLs to the deployed origin. Run database migrations from a
source checkout as a release step; the runtime image contains built application files.

## Quality Gates

CI runs dependency install, gitleaks, format check, lint, typecheck, unit tests, migration
history/drift checks, PostgreSQL auth integration, production build, and Chromium tests. A
`lefthook.yml` is included for local pre-commit lint/format hooks.

See [Testing](docs/TESTING.md) for setup, isolation, and test boundaries, and
[Template comparison](docs/TEMPLATE-COMPARISON.md) for the reviewed reference and remaining
feature differences. This starter supplies auth APIs and a client; it does not yet include
signup/login/settings screens or an upload flow.
