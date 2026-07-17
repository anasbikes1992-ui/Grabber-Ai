# /agents

One folder per agent; each contains a `SPEC.md` following
[templates/AGENT-SPEC-TEMPLATE.md](../templates/AGENT-SPEC-TEMPLATE.md).

Build order (MASTER §Build Order): `business-analyst/` and `system-architect/`
first. Planned set: analyst, architect, planner, backend, frontend, database,
devops, qa, security, documentation.

Layer constraints are absolute: Thinking agents never code; Building agents
never decide features; Verification agents never build (01 §2).
