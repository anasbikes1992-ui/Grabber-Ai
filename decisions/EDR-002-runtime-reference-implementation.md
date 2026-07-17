# EDR-002 — Runtime Sprint 1 Reference Implementation: dependency-free ESM JavaScript

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Owner** | Claude (Chief Software Architect) |
| **Date** | 2026-07-15 |
| **Project** | platform |
| **Stage** | development |

## Context
Sprint 1 must produce the six runtime services as working, tested code with
zero infrastructure friction, runnable by any contributor and by CI
immediately.

## Problem
Which language/toolchain for the runtime reference implementation?

## Alternatives
1. TypeScript + build toolchain — strongest compile-time contracts, but adds
   install/build steps before the first test can run; deferred, not rejected.
2. Python — fine, but the agent/runtime ecosystem targets Node interop first.

## Decision
Sprint 1 ships as **dependency-free ESM JavaScript (Node ≥ 20, `node:test`,
`node:crypto`)** with JSDoc type annotations. All contract enforcement
(artifact envelopes, event catalogue, layer separation, bundle validation)
is **runtime validation** — required by the specs anyway (docs/06 §5:
"enforced by type system, not convention" is satisfied by schema enforcement
at every write; a compile-time layer is additive, not a substitute).

## Trade-offs
No compile-time type errors until the TypeScript migration; mitigated by
exhaustive runtime schema checks and acceptance tests.

## Consequences
`node --test` runs the full acceptance suite with zero installs. TypeScript
migration is a mechanical follow-up (Article II: modules are replaceable).

## Assumptions
Node ≥ 20 available in all execution environments (verified: v22).

## Risks
Contributors bypassing schema checks → prevented by the registry being the
only write path (AM-03).

## Related Standards
CO-*, EH-*, GT-05 (provenance), OB-09/10.

## Related Components
runtime/src/** (all Sprint 1 services).

## Related Knowledge
docs/04–07.

## Review Trigger
Start of Sprint 2 (services as APIs) — revisit TypeScript then.
