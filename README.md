# TypeScript React Hono Template

A full-stack TypeScript monorepo with React 19, Vite, Hono on Bun, Better Auth,
Drizzle/PostgreSQL, and pnpm/Turborepo. It includes typed API access, runtime browser
configuration, production static serving, and GitHub Actions checks.

## Quick start

Use Node.js 22.23.3 (the CI version), pnpm 10.33.3, Bun 1.3.13 or newer, and a running
Docker engine. Other supported Node versions are listed in [Contributing](docs/CONTRIBUTING.md).

Run these commands from the repository root:

```bash
pnpm install --frozen-lockfile
cp .env.example .env
bun -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

In PowerShell, replace `cp` with `Copy-Item`. Paste the generated value into
`BETTER_AUTH_SECRET` in `.env`, then start the services and applications:

```bash
pnpm services:up
pnpm db:migrate
pnpm dev
```

| Service                   | Local URL                           |
| ------------------------- | ----------------------------------- |
| React application         | http://localhost:4000               |
| API                       | http://localhost:4001               |
| Interactive API reference | http://localhost:4001/api/scalar    |
| Authentication reference  | http://localhost:4001/api/auth/docs |
| Health check              | http://localhost:4001/api/health    |
| MailDev inbox             | http://localhost:1080               |
| MinIO console             | http://localhost:9001               |

The starter provides a landing page, reusable UI components, authentication APIs and a
React auth client, a protected profile endpoint, and optional SMTP and S3 clients.
Application-specific signup, login, settings, and upload screens are left to the application.

## Common commands

| Command                 | Purpose                                                          |
| ----------------------- | ---------------------------------------------------------------- |
| `pnpm dev`              | Run the web and API development servers                          |
| `pnpm check`            | Check formatting, lint, types, unit tests, and production builds |
| `pnpm test:integration` | Test authentication and migrations with PostgreSQL               |
| `pnpm test:e2e`         | Build and test the production app in Chromium                    |
| `pnpm build`            | Build `apps/web/dist` and `apps/api/dist`                        |
| `pnpm start`            | Serve the production API and built web app (default port 4001)   |
| `pnpm db:generate`      | Generate SQL migrations after a schema change                    |
| `pnpm db:migrate`       | Apply committed database migrations                              |
| `pnpm services:test`    | Start an isolated PostgreSQL test service on port 5433           |

Integration tests require the test service. Browser tests require Chromium; see
[Testing](docs/TESTING.md) for setup and the scope of each suite.

## Documentation

Start with the [documentation index](docs/README.md), or choose a guide:

| Guide                                   | Contents                                                                        |
| --------------------------------------- | ------------------------------------------------------------------------------- |
| [Architecture](docs/ARCHITECTURE.md)    | Workspace boundaries, request flow, authentication, and runtime configuration   |
| [API](docs/API.md)                      | Endpoints, session cookies, error responses, OpenAPI, and Scalar                |
| [Contributing](docs/CONTRIBUTING.md)    | Local setup, service ports, development commands, migrations, and pull requests |
| [Deployment](docs/DEPLOYMENT.md)        | Production environment, Docker, migrations, reverse proxies, and health checks  |
| [Testing](docs/TESTING.md)              | Unit, PostgreSQL integration, browser tests, and test isolation                 |
| [CI and dependency updates](docs/CI.md) | GitHub checks, Release Please, and Dependabot maintenance                       |

For a local production preview, run `pnpm build` followed by `pnpm start`, then open
http://localhost:4001. For a deployed environment, follow the
[deployment guide](docs/DEPLOYMENT.md) to configure public URLs and apply migrations first.
