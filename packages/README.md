# Packages — Platform Extension Framework (v1.6)

Grabber AI Studio **Core** extension surface. External code and the CLI import
these packages — never `runtime/src/*` private modules (except Core hosts).

| Package | Role |
|---------|------|
| `@grabber/common` | Manifest schema, lifecycle constants, errors |
| `@grabber/sdk` | Foundation API clients (Project, DNA, Artifact, Knowledge, …) |
| `@grabber/plugin-sdk` | `definePlugin` |
| `@grabber/connector-sdk` | `defineConnector` (thin: auth/transport only) |
| `@grabber/skill-sdk` | `defineSkill` |
| `@grabber/workflow-sdk` | `defineWorkflow` |
| `@grabber/template-sdk` | `defineTemplate` |
| `@grabber/agent-sdk` | `defineAgent` + lifecycle steps (full runtime v1.7) |
| `@grabber/cli` | `grabber` CLI |

Extension host: `runtime/src/extensions` (shared lifecycle for all types).
