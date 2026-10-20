# Documentation

These guides describe how to develop, extend, test, and deploy this repository. Run package
commands from the repository root unless a guide says otherwise.

## Guides

| Guide                              | Read it when you need to                                                                 |
| ---------------------------------- | ---------------------------------------------------------------------------------------- |
| [Architecture](ARCHITECTURE.md)    | Understand package boundaries, client/server communication, configuration, and data flow |
| [API](API.md)                      | Call an endpoint, use a session, inspect errors, or extend the API reference             |
| [Contributing](CONTRIBUTING.md)    | Set up a checkout, change the schema, or prepare a pull request                          |
| [Deployment](DEPLOYMENT.md)        | Configure and release the production server or container                                 |
| [Testing](TESTING.md)              | Run the suites and understand their coverage and isolation                               |
| [CI and dependency updates](CI.md) | Configure GitHub checks, manage releases, or review dependency updates                   |

The root [README](../README.md) contains the quick start and the most common commands.

## Suggested paths

- **First checkout:** follow [local setup](CONTRIBUTING.md#local-setup), then run
  [the quality checks](CONTRIBUTING.md#quality-checks-and-tests).
- **Add a feature:** read [workspace boundaries](ARCHITECTURE.md#workspace-boundaries),
  [API conventions](API.md#extending-the-api), and the
  [migration workflow](CONTRIBUTING.md#database-changes).
- **Ship a release:** configure the [production environment](DEPLOYMENT.md#environment),
  apply [migrations](DEPLOYMENT.md#database-release-step), and run the
  [deployment checks](DEPLOYMENT.md#deployment-checks).
- **Maintain the template:** use the [CI guide](CI.md) for required checks, Release Please,
  and Dependabot updates.

## Documentation layout

```text
docs/
  README.md          Documentation index
  ARCHITECTURE.md    Components, boundaries, and runtime behavior
  API.md             HTTP endpoints and integration conventions
  CONTRIBUTING.md    Setup and development workflow
  DEPLOYMENT.md      Production configuration and release steps
  TESTING.md         Test commands, prerequisites, and coverage
  CI.md              GitHub Actions, releases, and dependency updates
```

When changing a route, environment variable, database workflow, or package command, update
its guide alongside the implementation. The source links in each guide identify the files
that define the documented behavior.
