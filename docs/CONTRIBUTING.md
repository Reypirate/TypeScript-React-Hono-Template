# Contributing

[Documentation index](README.md)

## Prerequisites

- Git.
- Node.js 22.23.3, matching CI. The supported range is `^22.22.2 || ^24.15.0 || >=26.0.0`;
  Node 23 and 25 are excluded by jsdom's runtime requirements.
- pnpm **10.33.3**, pinned in the root `packageManager` field.
- Bun **1.3.13** or newer for the API, bundler, and integration tests. CI uses 1.3.13.
- A running Docker engine with Compose v2 for the supplied local services.

Node runs build and test tooling; the application server runs on Bun. Check installed
versions with `node --version`, `pnpm --version`, `bun --version`, and `docker compose version`.

## Local setup

Clone your repository and run commands from its root. Install the frozen dependency graph:

```bash
pnpm install --frozen-lockfile
cp .env.example .env
```

For PowerShell, use `Copy-Item .env.example .env`. Generate an auth secret:

```bash
bun -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Paste the output into `BETTER_AUTH_SECRET` in `.env`. Keep `.env` local; the example leaves
the secret blank intentionally. The API requires a database URL and a secret of at least
32 characters, including when `CI` is set. Defaults and optional fields are defined in
[`.env.example`](../.env.example) and [`env-config.ts`](../apps/api/env-config.ts).

Start development infrastructure, apply migrations, and launch both apps:

```bash
pnpm services:up
pnpm db:migrate
pnpm dev
```

Open the web app at http://localhost:4000 and the API reference at
http://localhost:4001/api/scalar. Vite proxies `/api` to port 4001. If changing the API port,
update the Vite proxy as well as the environment URLs and server port.

## Local services

[`docker-compose.yaml`](../docker-compose.yaml) provides development services and a separate
PostgreSQL test profile. `services:up` waits for services and initializes the MinIO bucket.

| Service                 | Host port       | Purpose                                         |
| ----------------------- | --------------- | ----------------------------------------------- |
| PostgreSQL 17           | `5432`          | Application database `app`                      |
| PostgreSQL test profile | `5433`          | Integration test connection database `app_test` |
| MailDev                 | `1025` / `1080` | SMTP / browser inbox                            |
| MinIO                   | `9000` / `9001` | S3 API / browser console                        |

Compose credentials are development defaults. PostgreSQL and MinIO development data are
stored under the ignored `data/` directory. `pnpm services:down` stops and removes Compose
containers and networks without deleting those bind-mounted files. To stop only the test
database, use `docker compose --profile test stop postgres_test`.

SMTP is enabled by the example environment. To work without outbound mail, leave
`SMTP_HOST`, `SMTP_PORT`, and `SMTP_FROM` empty. S3 settings enable an optional storage
client; the starter does not expose upload endpoints.

## Development commands

| Command                       | Action                                                         |
| ----------------------------- | -------------------------------------------------------------- |
| `pnpm dev`                    | Run both app development servers through Turbo                 |
| `pnpm --filter @repo/web dev` | Run Vite only                                                  |
| `pnpm --filter @repo/api dev` | Run the Bun API with hot reload only                           |
| `pnpm build`                  | Produce both production bundles                                |
| `pnpm start`                  | Run the bundled API and serve the web build in production mode |
| `pnpm format`                 | Apply repository formatting                                    |
| `pnpm db:studio`              | Open the configured database in Drizzle Studio                 |

Run `pnpm build` before `pnpm start`. The startup wrapper always selects production mode
and resolves static paths from the repository root.

## Code organization

Read [Architecture](ARCHITECTURE.md#workspace-boundaries) before crossing package boundaries.
Keep feature UI in `apps/web/src/features`, route files in `apps/web/src/routes`, reusable
components in `apps/web/src/components/ui`, and shared validation contracts in
`packages/shared`. Let the router plugin regenerate `routeTree.gen.ts`.

Use `workspace:*` for internal packages. Dependency versions shared by multiple packages
belong in the pnpm catalog. After a dependency change, update and commit `pnpm-lock.yaml`
with the manifests. Keep Node typings aligned with the Node 22 tooling baseline.

Oxfmt and Oxlint define formatting and lint rules. A [`lefthook.yml`](../lefthook.yml) is
provided for contributors who install and enable Lefthook; installing dependencies alone
does not install the hook runner. CI remains the shared quality gate.

## Database changes

Edit [`packages/db/schema/index.ts`](../packages/db/schema/index.ts), then generate, review,
and apply the migration:

```bash
pnpm db:generate
pnpm db:check
pnpm db:check-drift
pnpm db:migrate
```

Commit the schema, generated SQL, snapshots, and journal under `packages/db/drizzle`
together. Review SQL before applying it, especially when renaming or removing columns.
`db:check` validates migration history; `db:check-drift` detects schema changes without
matching migration files. They do not need a running database, though `db:check` still
requires `DATABASE_URL` to load Drizzle's configuration.

`pnpm db:push` can synchronize a disposable local database directly. For changes intended
to ship, use committed migrations. The initial migration expects empty application tables;
an existing database created with `db:push` needs a reviewed baseline before adopting the
migration history. See the [production release step](DEPLOYMENT.md#database-release-step).

## Quality checks and tests

```bash
pnpm check
pnpm db:check
pnpm db:check-drift
pnpm audit
```

`pnpm check` runs formatting, lint, TypeScript, workspace Vitest tests, and production
builds. Run database integration tests for auth or schema changes:

```bash
pnpm services:test
pnpm test:integration
```

For frontend behavior and production serving, install Chromium and run the browser suite:

```bash
pnpm exec playwright install chromium
pnpm test:e2e
```

See [Testing](TESTING.md) for database isolation, `TEST_DATABASE_URL`, browser reports, and
the behavior each suite covers. Add tests that exercise the changed behavior at the
appropriate boundary. Documentation changes should have working links, commands that
match package scripts, and examples consistent with the implementation.

## Pull requests

Create a branch from current `main` and keep the change focused. Use Conventional Commit
titles such as `fix: reject expired sessions`, `feat: add profile settings`, or
`docs: explain database setup` so Release Please can classify changes.

Use the [PR template](../.github/PULL_REQUEST_TEMPLATE.md) to explain the problem, the
resulting behavior, validation performed, and any migration or deployment action required.
Update the relevant guides when changing routes, environment variables, setup, or scripts.
Push the branch, open a PR against `main`, and resolve failing checks before merging.

The [CI guide](CI.md) lists the checks, release setup, and dependency review process.
