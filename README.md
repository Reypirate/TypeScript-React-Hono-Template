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

- Node.js 22.14+
- pnpm 9.15+
- Bun 1.3+

```bash
pnpm install
cp .env.example .env
pnpm dev
```

Development servers:

- Web: http://localhost:4000
- API: http://localhost:4001
- API docs: http://localhost:4001/api/scalar
- Health: http://localhost:4001/api/health

## Runtime Configuration

The API serves `/api/runtime.js`, which exposes only `VITE_*` variables to the browser:

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
- `pnpm db:push` - push Drizzle schema using `.env`
- `pnpm db:studio` - open Drizzle Studio using `.env`

## Local Services

`docker-compose.yaml` includes PostgreSQL, MailDev, and MinIO. They support the optional
database, email, and S3-compatible storage settings in `.env.example`.

## Production

```bash
pnpm build
pnpm start
```

The Hono server serves API routes under `/api/*`, Better Auth under `/api/auth/*`, runtime
client env at `/api/runtime.js`, and the built React app from `apps/web/dist` when
`NODE_ENV=production`.

Docker:

```bash
docker build -t react-hono-template .
docker run --env-file .env -p 4001:4001 react-hono-template
```

## Quality Gates

CI runs dependency install, gitleaks, format check, lint, typecheck, tests, and build. A
`lefthook.yml` is included for local pre-commit lint/format hooks.
