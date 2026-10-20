# Changelog

## [0.1.2](https://github.com/Reypirate/TypeScript-React-Hono-Template/compare/v0.1.1...v0.1.2) (2026-10-20)


### Bug Fixes

* align workspace and transitive typings with Node 22 ([fb76583](https://github.com/Reypirate/TypeScript-React-Hono-Template/commit/fb76583079df916179334068f48530c0887dbecd))
* apply Node 22 alignment to the resolver upgrade ([006d866](https://github.com/Reypirate/TypeScript-React-Hono-Template/commit/006d86659038e366a267163a72c2f6ea76d7b1f2))
* apply shared dependency fixes to the Radix upgrade ([592f8a3](https://github.com/Reypirate/TypeScript-React-Hono-Template/commit/592f8a389a9c5c016f4df6ff46e31589efaf3584))
* refresh Radix upgrade and cover context menu interactions ([7a1d43c](https://github.com/Reypirate/TypeScript-React-Hono-Template/commit/7a1d43c2202d93fa87241b1ee7deff33882c12d4))
* refresh resolver upgrade and cover Zod form validation ([883479c](https://github.com/Reypirate/TypeScript-React-Hono-Template/commit/883479c17378d7e0605e95c4f6e0c6b77d627cac))
* support jsdom 30 with current Node 22 build runtimes ([db622a4](https://github.com/Reypirate/TypeScript-React-Hono-Template/commit/db622a4e09ef891fbbc281fab2c3d1800860c983))
* verify jsdom upgrade with shared Node 22 dependencies ([b51684a](https://github.com/Reypirate/TypeScript-React-Hono-Template/commit/b51684a8e39e0e5be2113e45fe96d0e4746c776a))

## [0.1.1](https://github.com/Reypirate/TypeScript-React-Hono-Template/compare/v0.1.0...v0.1.1) (2026-10-19)

### Bug Fixes

- supply database config for offline CI migration checks ([23033d8](https://github.com/Reypirate/TypeScript-React-Hono-Template/commit/23033d8c5f114268c9daaca62b4d88da8c29256b))

## Changelog

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
