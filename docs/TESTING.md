# Testing

Run commands from the repository root. Use the pinned pnpm version and install with
`pnpm install --frozen-lockfile`.

Run `pnpm audit --prod` to check the locked production dependency graph against current
registry advisories. CI runs this check too.

## Unit and HTTP boundary tests

```bash
pnpm check
```

This checks formatting, linting, TypeScript (including integration and browser tests), Vitest,
and production builds. `pnpm test` runs workspace unit tests without PostgreSQL or SMTP.
The API tests call Hono's HTTP interface with an injected auth service; they verify CORS,
protected routes, error responses, runtime configuration, and API/frontend route boundaries.
Request-log tests check that auth path/query tokens are not included in access logs.
Environment tests check boolean parsing, port validation, and required secrets even in CI.
Frontend unit tests use jsdom through `apps/web/vitest.config.ts`; backend tests use Node.

## Database and authentication integration

Docker Desktop must be running.

```bash
pnpm services:test
pnpm test:integration
```

The test service listens on port 5433 and uses the `app_test` database. The suite creates a
random `template_test_*` database, applies the committed SQL migrations, and drops that
database after the run. This also exercises the actual `public` foreign keys in generated
migrations. The development `DATABASE_URL` is never used by the suite.

Override `TEST_DATABASE_URL` to use another PostgreSQL server. Its role must have `CREATEDB`
permission. In PowerShell:

```powershell
$env:TEST_DATABASE_URL = 'postgres://postgres:password@localhost:5433/app_test'
pnpm test:integration
```

Tests exercise password hashing, sign-up/sign-in/sign-out, session revocation and expiration,
tampered cookies, untrusted origins, rate limiting with an explicit client IP, foreign-key
cascades, email verification, password reset, and one-time reset tokens. Email callbacks
capture generated messages; they do not claim to test an external SMTP provider.

After testing, stop only the test service with `docker compose --profile test stop postgres_test`.
Do not delete application volumes to reset tests.

## Production browser tests

```bash
pnpm exec playwright install chromium
pnpm test:e2e
```

This builds both apps, starts the bundled Bun server on `http://127.0.0.1:4101`, and runs
Chromium against it. Playwright owns and stops the server. Tests do not reuse a development
server or load the user's `.env`; configuration and the auth secret are supplied for the run.

Tests cover frontend rendering with real JavaScript/CSS assets, runtime configuration,
direct deep links and not-found recovery, API JSON 404s, anonymous session refusal, OpenAPI,
and the documentation HTML. The browser suite does not test login forms or dashboards:
these UI features are not implemented in this starter.

Use `pnpm exec playwright show-report` to inspect the HTML report. Failure traces and
screenshots are kept in ignored `test-results/` and `playwright-report/` directories.

## Migrations

```bash
pnpm db:check
pnpm db:check-drift
```

`db:check` validates migration history. `db:check-drift` runs generation without connecting
to a database and fails when the migration directory changes, including new untracked files.
When it fails, review and commit the generated SQL and metadata. `db:generate` and `db:migrate`
use the configured `.env`; inspect generated SQL before applying it.

The initial migration expects empty application tables. An existing database created with
`db:push` needs a reviewed baseline before adopting migration history.

## CI

GitHub Actions installs the frozen lockfile, scans for secrets, checks formatting/lint/types,
runs unit tests, checks migrations and drift, runs integration tests against PostgreSQL, builds,
and tests the production app in Chromium. Browser reports upload on failure. Local results
do not assert that a remote GitHub Actions run has completed.
