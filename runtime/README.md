# /runtime — first-class citizen

The executable half of the platform. Everything here implements the runtime
architecture specified in [docs/04-RUNTIME-ARCHITECTURE.md](../docs/04-RUNTIME-ARCHITECTURE.md);
this folder contains software (and its configuration), not documentation.

| Directory | Implements | Spec |
|-----------|-----------|------|
| `src/context/` | Context Engine — deterministic context bundles | docs/05-CONTEXT-ENGINE.md |
| `src/artifacts/` | Artifact Registry — envelope enforcement, lifecycle | docs/06-ARTIFACT-MODEL.md |
| `src/events/` | Event Bus — catalogue, envelopes, append-only log | docs/04 §4 |
| `src/state-machine/` | Project State Machine — stage declarations + engine | docs/07-PROJECT-STATE-MACHINE.md |
| `src/validation/` | Validation Runtime — eight-step sequence, rubrics | docs/04 §6 |
| `src/orchestration/` | Execution Engine core — task derivation, sequencing | docs/04 §3 |
| `src/services/` | **Foundation APIs** (Sprint 2) — DNA, Rule, Decision, Capability, Pattern, Knowledge, Artifact Query, Dependency Graph | EDR-004, docs/04 §7/§9.6 |
| `src/storage/` | Storage contracts + SCHEMA (Memory default; PG/Redis/vector adapters later) | EDR-004 |
| `src/policy/` | Policy Engine | EDR-001 |
| `src/health/` | System Health Monitor | EDR-001 |
| `src/telemetry/` | Pipeline observability — OB-09/OB-10 records | standards/15 |
| `pilot/` | Task Manager end-to-end pilot | EDR-003 |
| `test/` | Acceptance tests (Sprint 1 + pilot + Sprint 2) | docs/04 §9 |

Ground rules: components communicate only via events and typed queries
(Article II) · no business intelligence in the engine — workflows and
standards decide, the runtime sequences (RT-02) · every dispatch, bundle,
artifact, and transition is provenance-tracked (Article V) · external
consumers use Foundation APIs only (`src/services`), never private modules.

Acceptance: docs/04 §9 (including §9.6 Dependency Graph). Run: `npm test`.
