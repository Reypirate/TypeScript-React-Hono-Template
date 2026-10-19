# Template comparison

Reviewed against [`zekkv/tanstack-start-template` at `faba37b`](https://github.com/zekkv/tanstack-start-template/tree/faba37baaf2f5549a7922cb8ac8aebd77c068b8a)
on 2026-10-19. This comparison uses source files, test configuration, and workflows, rather
than treating the reference README's feature list as verification.

| Area            | Reference                                                                             | This repository                                                                                                        |
| --------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Architecture    | TanStack Start SSR, Nitro, one application                                            | Vite React SPA, Hono API, pnpm/Turbo workspaces; retain the separate API boundary                                      |
| Database        | Drizzle, Bun SQL, generated migrations                                                | Drizzle/postgres-js, generated migrations, auth lookup indexes, history and drift checks                               |
| Auth backend    | Better Auth, email/password, OTP, passkeys, optional Google OAuth                     | Email/password, optional verification/reset email, explicit trusted origins, in-memory throttling, protected `/api/me` |
| Auth UI         | Login, signup, password reset, OTP, dashboard and account settings                    | Auth client available; these screens are not implemented                                                               |
| Feature example | Authenticated notes CRUD with ownership checks                                        | Protected profile API example; no domain CRUD example                                                                  |
| Storage         | Validated, authenticated presigned uploads                                            | Optional S3 client configuration; no upload endpoint or upload UI                                                      |
| Email           | React Email templates, Resend/SMTP                                                    | Optional Nodemailer SMTP, plain-text auth emails                                                                       |
| Observability   | LogTape and Sentry integration                                                        | Structured request logs with route patterns and request IDs, generic public 500 errors                                 |
| Configuration   | Validated server/client environment                                                   | Validated environment and an uncached runtime script with an explicit public allowlist                                 |
| Tests           | Vitest unit/integration, Testcontainers, Playwright app flows and coverage thresholds | Vitest HTTP/configuration tests, isolated PostgreSQL/Bun auth integration, Playwright production smoke tests           |
| Delivery        | CI quality, security, migrations, integration/E2E and builds                          | CI includes these check categories; no automated release workflow                                                      |

Reference implementations: [authentication](https://github.com/zekkv/tanstack-start-template/blob/faba37baaf2f5549a7922cb8ac8aebd77c068b8a/src/lib/auth.server.ts),
[uploads](https://github.com/zekkv/tanstack-start-template/blob/faba37baaf2f5549a7922cb8ac8aebd77c068b8a/src/features/uploads/presign.server.ts),
[test configuration](https://github.com/zekkv/tanstack-start-template/blob/faba37baaf2f5549a7922cb8ac8aebd77c068b8a/vitest.config.ts),
and [browser flow](https://github.com/zekkv/tanstack-start-template/blob/faba37baaf2f5549a7922cb8ac8aebd77c068b8a/tests/e2e/auth-notes-flow.test.ts).

## Problems addressed in this review

- A test accessed an unknown JSON value without narrowing it, failing TypeScript.
- The API entry point contained a UTF-8 BOM rejected by lint; several edited files were unformatted.
- The drift script resolved an unexported Drizzle CLI subpath, so it never checked drift.
- Integration isolation used a schema while migrations referenced `public.user`. Tests now use
  a disposable database and run the original migrations unchanged.
- There were no browser tests of the production bundle. Chromium now exercises the built app
  and its HTTP responses, with failure artifacts in CI.
- The start command inherited development mode from `.env`, preventing SPA static serving.
  Production start now sets its mode and resolves static paths from the repository root.
- Verification emails were configured without sending them on signup. Configured email
  now enables signup verification delivery, covered by the integration flow.
- Better Auth disables origin checks by default in test mode. Explicit settings now keep
  CSRF/origin checks enabled, and integration requests include browser metadata and isolated client IPs.
- Router and query developer tools were rendered unconditionally. They now render only in development.

- Request logs included verification query tokens. Logs now use matched route patterns and
  request IDs, with a regression test for both path and query tokens.
- The dependency audit identified vulnerable auth, HTTP, mail, build/test, and transitive
  packages. Those dependency families were updated and the suites rerun against them.
- Docker's build context included nested host dependencies. Recursive exclusions now prevent
  Windows dependency links and existing build outputs from overwriting container dependencies.
- The web RPC client now imports the API's type entry point without loading the server bootstrap.
- The local-storage hook now subscribes to external storage with React's store API; five
  frontend tests cover persisted updates, tab/component synchronization, key changes, and fallback values.
- The unused shadcn generator was removed from installed development dependencies after its
  dependency tree still reported advisories, including one without an upstream fix. Existing
  UI components are maintained as source and do not require that CLI to run or build.

## Local verification results

Verified on 2026-10-19 with Node 24.15.0, Bun 1.4.3, PostgreSQL 17, and Chromium.
The Docker build also exercised Linux Node 22 and Bun 1.3.13 from the existing image.

| Check                                     | Result                                                                                                               |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `pnpm check`                              | Passed: formatting, lint with no findings, TypeScript, 27 Vitest tests, production builds                            |
| `pnpm test:integration`                   | Passed: 8 tests against actual committed migrations and Better Auth/PostgreSQL                                       |
| `pnpm exec playwright test`               | Passed: 4 Chromium tests against the final production bundle                                                         |
| `pnpm db:check` and `pnpm db:check-drift` | Passed                                                                                                               |
| Negative migration probe                  | Detected a temporary schema change and new migration; restored all source/migration files exactly                    |
| `pnpm audit` and `pnpm audit --prod`      | Both report no known vulnerabilities                                                                                 |
| Docker build with frozen lockfile         | Passed after correcting the build context                                                                            |
| Running Docker image                      | Passed health, frontend, built JS, runtime config, API 404, protected-route refusal, deep-link, and docs HTTP checks |

Temporary application databases were removed by the integration suite and the smoke container
was stopped and removed. These results do not include a remote GitHub Actions run or a local
Gitleaks run. Email callbacks capture actual generated messages; external SMTP delivery and
S3 services were not exercised.

## Remaining feature choices

The next functional additions are auth screens with a protected route, account settings,
an ownership-scoped CRUD example, and a validated upload flow. Add passkeys, OAuth, OTP,
structured logging, or error reporting when the application needs them. Each needs its own
UI and integration coverage; installing the reference's dependencies alone does not implement it.

Auth throttling is in memory per server process and needs a trusted client IP header from
the deployment proxy. A shared store and trusted proxy configuration are deployment work
for multiple instances. The browser smoke suite does not establish parity with the reference's
full user journeys, coverage thresholds, SMTP delivery, or storage integrations.

See [Testing](TESTING.md) for reproducible commands and the boundaries each suite exercises.
