# /pipelines

Executable workflow definitions, grouped as `planning/`, `development/`,
`testing/`, `deployment/`. Every workflow follows
[templates/WORKFLOW-TEMPLATE.md](../templates/WORKFLOW-TEMPLATE.md).

Every pipeline embeds the security suite (01 §8) and logs metrics (01 §6).
No workflow advances past a failed confidence gate (01 §3).
