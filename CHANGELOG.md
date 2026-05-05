# Changelog

## Unreleased

### Added

- Production-oriented monorepo build and Bun API start path.
- Runtime client environment injection through `/api/runtime.js`.
- OpenAPI JSON and Scalar-compatible API reference at `/api/scalar`.
- React Query and NUQS providers in the web app.
- Feature-based landing and not-found pages.
- Starter UI primitives, browser hooks, and formatting helpers.
- CI workflow with install, secret scan, format, lint, typecheck, test, and build steps.
- Oxc formatter/linter config and Lefthook pre-commit jobs.
- Optional SMTP and S3-compatible service wiring.

### Changed

- Dockerfile now builds the pnpm/Turbo monorepo instead of assuming a single-package app.
- Drizzle auth tables now provide safer defaults and cascade user-owned rows.
