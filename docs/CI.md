# CI and dependency updates

## Checks

The workflows run on pushes to `main` and on pull requests. Each check runs independently,
so a secret-scanner failure does not prevent tests from running. Manual runs are available
through `workflow_dispatch`. Security checks also run every Monday at 06:00 UTC.

| Workflow          | Check                          | What it verifies                                                                       |
| ----------------- | ------------------------------ | -------------------------------------------------------------------------------------- |
| Security Checks   | CodeQL (javascript-typescript) | JavaScript and TypeScript security analysis, uploaded to code scanning                 |
| Security Checks   | Dependency audit               | `pnpm audit` against the complete frozen dependency graph, including development tools |
| Security Checks   | Gitleaks                       | Secrets in Git history, with PR read access and commenting disabled                    |
| Code Quality      | Lint, type check, and build    | Formatting, oxlint, TypeScript, migration history/schema drift, and production builds  |
| Unit Tests        | Unit tests                     | Workspace Vitest suites, including API HTTP tests and frontend jsdom tests             |
| Integration Tests | Integration tests              | Committed migrations and actual Better Auth/PostgreSQL flows in isolated databases     |
| Build             | Production build               | Both application bundles, uploaded as the `production-build` artifact                  |
| E2E Tests         | E2E tests                      | Production build and Chromium smoke tests; reports/traces upload on failure            |
| Release Please    | release-please                 | Maintains a release PR and publishes the GitHub release after that PR is merged        |

Application jobs share `.github/actions/setup/action.yml`: Node 22.18.0, Bun 1.3.13, pnpm
from the root `packageManager` field, a pnpm store cache, and a frozen lockfile install.
Third-party actions use immutable commit SHAs with version comments; Dependabot monitors
the workflows and the composite action. No application credentials are needed for tests.

The E2E suite currently tests anonymous production behavior and needs no database service.
The integration workflow owns a PostgreSQL 17 service and creates/drops its own test database.
If browser tests begin signing users in, provision PostgreSQL and migrations in that workflow.

Code Quality retains a build to check the whole workspace together. Build separately retains
downloadable production outputs; E2E builds the exact checkout it will serve in Chromium.

## GitHub setup

After these workflows are on `main`, let them run once before configuring required checks.
Replace any old required `ci` check with the eight validation checks above. Release Please
only runs on `main` and should not be required on ordinary pull requests. Run every validation
workflow for documentation-only PRs too, so required checks do not remain pending.

Use CodeQL advanced setup for `security-checks.yml`. If CodeQL default setup is already
enabled, switch to advanced setup to avoid conflicting configurations. Code scanning is
available for this public repository; private copies need the appropriate GitHub plan.
See [GitHub's setup guide](https://docs.github.com/en/code-security/how-tos/find-and-fix-code-vulnerabilities/configure-code-scanning/configuring-advanced-setup-for-code-scanning).

Gitleaks uses the job's automatic `github.token`, with only `contents: read` and
`pull-requests: read`. Personal repositories do not need a Gitleaks license. Organization
copies need `GITLEAKS_LICENSE`; if Dependabot needs it, configure it as a Dependabot secret
as well. PR code is run through `pull_request` with no repository write permissions.
See [Gitleaks](https://github.com/gitleaks/gitleaks-action) and
[Dependabot's Actions restrictions](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-on-actions).

## Releases

The root package is released as one template, initially version `0.1.0`. Private workspace
packages remain internal. `release-please-config.json` starts collecting changes after commit
`b5825e7570b584505087a878422b88f185c1db2a`; change or remove `bootstrap-sha` when reusing this
configuration in a repository without that history.

Use Conventional Commits, for example `fix: handle expired sessions` or `feat: add profile
settings`. Release Please creates a PR with a root package version bump, changelog, and
manifest update. Review and merge it when ready to tag a GitHub release. It does not publish
packages to npm or deploy an application.

In Settings > Actions > General, allow GitHub Actions to create pull requests. The release
job requests `contents: write`, `issues: write`, and `pull-requests: write`; validation jobs
keep read-only repository access.

The workflow defaults to `github.token`. PRs created with this token do not automatically
trigger other Actions workflows. To get automatic validation on release PRs, provide a
repository-scoped token as the `RELEASE_PLEASE_TOKEN` Actions secret with Contents, Issues,
and Pull requests write access. Alternatively, manually close and reopen the release PR
from your own account to trigger its `pull_request` checks before merging.
See [Release Please authentication](https://github.com/googleapis/release-please-action#github-credentials).

## Reviewing Dependabot PRs

Dependabot proposes dependency and action updates; opening a PR does not change `main`.
A version-update PR does not by itself mean the old dependency has a known vulnerability.
Security updates are linked to advisories/Dependabot alerts. Prioritize those alerts, then
review ordinary updates for compatibility and regressions.

1. Read the changed manifests, lockfile, upstream release notes, and any breaking changes.
2. Refresh the branch against current `main` and let the complete validation suite run.
3. For package updates, require a frozen install, types, unit tests, integration, production
   build, browser tests, and audit to pass. UI-library changes also need a visual/keyboard
   check of the affected component; the existing browser smoke suite does not exercise every
   reusable component.
4. Merge passing, understood updates. Resolve failures before merging; hold major upgrades
   until their runtime requirements and migration work are understood. Automatic merging is
   not configured.

Weekly minor/patch development-tool updates are grouped to reduce noise. Major updates stay
separate. Action minor/patch updates are grouped too; major action upgrades remain individual.
These groups do not replace review or CI.

### Review snapshot: 2026-10-20

The repository's existing `main` CI run for `b5825e7`
[passed](https://github.com/Reypirate/TypeScript-React-Hono-Template/actions/runs/39277637728).
The following results describe existing PRs, before the new workflows have run remotely.

| PR                                                                       | Proposal                       | Findings and next action                                                                                                                                                                                                                 |
| ------------------------------------------------------------------------ | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [#1](https://github.com/Reypirate/TypeScript-React-Hono-Template/pull/1) | setup-node v4 to v7            | Its old run failed at Gitleaks because the token was absent, not at setup-node. The CI update includes v7.1.0. Close as superseded after this CI change lands and passes.                                                                |
| [#2](https://github.com/Reypirate/TypeScript-React-Hono-Template/pull/2) | checkout v4 to v7              | Latest CI passed. The CI update includes v7.0.1. Close as superseded after this change lands and passes.                                                                                                                                 |
| [#3](https://github.com/Reypirate/TypeScript-React-Hono-Template/pull/3) | gitleaks-action v2 to v3       | Latest CI passed. v3 migrates the action runtime to Node 24. This CI update includes v3.0.0; close as superseded after it passes.                                                                                                        |
| [#4](https://github.com/Reypirate/TypeScript-React-Hono-Template/pull/4) | pnpm/action-setup v4 to v6     | Latest CI passed. The action update does not change this project's pnpm version. This CI update includes v6.1.0; close as superseded after it passes.                                                                                    |
| [#6](https://github.com/Reypirate/TypeScript-React-Hono-Template/pull/6) | jsdom 26 to 30                 | Conflicts with the lockfile. jsdom 30.1.3 requires Node 22.22.2+, 24.15.0+, or 26+ (excluding Node 23/25), so CI's Node 22.18.0 is unsupported. Hold until the Node baseline is deliberately upgraded and migration/frontend tests pass. |
| [#7](https://github.com/Reypirate/TypeScript-React-Hono-Template/pull/7) | @types/node 25 to 26           | Conflicts with the current lockfile. CI/build tooling targets Node 22, so Node 26 types can permit APIs absent at runtime. Hold and align types with the supported Node baseline as a separate tested change.                            |
| [#8](https://github.com/Reypirate/TypeScript-React-Hono-Template/pull/8) | Radix context menu 2.2 to 2.4  | Conflicts with the current lockfile; old CI stopped at Gitleaks. Refresh and run the new checks, then smoke-test context menu interactions before merging.                                                                               |
| [#9](https://github.com/Reypirate/TypeScript-React-Hono-Template/pull/9) | Hook Form resolvers 5.2 to 5.9 | Conflicts with the current lockfile; old CI stopped at Gitleaks. Current React Hook Form/Zod versions fit the proposed peer ranges. Refresh and verify resolver behavior/types before merging.                                           |

The package-update branches were based on `848feb3`, before the dependency/security fixes in
`b5825e7`. Refresh rather than copying their old lockfiles over current `main`.

A subsequent Dependabot refresh [failed in the updater](https://github.com/Reypirate/TypeScript-React-Hono-Template/actions/runs/39277871774/job/118146640376)
with `ERR_PNPM_NO_MATURE_MATCHING_VERSION`: Nodemailer 10.1.7 was only 21 hours old and did
not satisfy the updater's minimum-release-age constraint. This is different from a failing
application test. Wait for the release-age window to pass and retry the Dependabot update
from Insights > Dependency graph > Dependabot. A maintainer can also comment
`@dependabot rebase` on an affected PR. Do not disable the release-age guard or downgrade a
security fix just to make the updater green.

If a refresh still fails, inspect its current log and regenerate only the intended dependency
update from current `main` using the pinned pnpm version, then run the full checks. This review
does not merge, close, approve, or comment on the existing PRs.
