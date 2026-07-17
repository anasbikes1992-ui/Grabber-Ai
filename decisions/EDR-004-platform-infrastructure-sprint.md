# EDR-004 — Platform Infrastructure Sprint (Sprint 2 Scope Refinement)

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Owner** | Anaz |
| **Date** | 2026-07-15 |
| **Project** | platform |
| **Stage** | architecture |

## Context
EDR-003 green-lit Sprint 2 after the pilot proved the runtime. The CTO review
reframed Sprint 2 as **Platform Infrastructure**, not merely “more services.”
That framing is adopted: the goal is a persistent, queryable, observable
foundation so the validated runtime can scale from one pilot into a reusable
platform.

## Problem
Ship eight markdown-backed concepts as APIs without locking storage choices
or letting future agents/plugins reach into runtime internals.

## Alternatives
1. In-memory services only — rejected as pilot-grade, not platform-grade.
2. PostgreSQL + Redis + vector DB hard-wired now — rejected: couples business
   logic to vendors before contracts stabilize (Rule 2).
3. **APIs + storage contracts + default in-memory providers + explicit schema**
   — chosen: production contracts, swappable backends, testable without ops.

## Decision
1. **Sprint 2 objective:** build the persistent, queryable foundation that
   allows the validated runtime to scale. Official name:
   **Platform Infrastructure Sprint**. Version target: **v1.5**.
2. **Foundation APIs (must ship):** Artifact Query, Dependency Graph,
   Knowledge, Decision, Rule, Project DNA, Pattern, Capability.
3. **Storage design (must ship as contracts + schemas):**
   - Relational entities: Projects, Artifacts, Users, Organizations,
     Capabilities, Rules, EDRs, Patterns, Knowledge, State, Events, Policies
   - Cache/queue: sessions, locks, scheduling, job queues (Redis-shaped)
   - Vector: knowledge, patterns, docs, semantic search — **provider-swappable**
4. **Default providers:** in-memory DocumentStore, GraphStore, VectorIndex for
   tests and local runs. PostgreSQL/Redis/vector adapters land when ops
   requires them; business logic never imports a driver directly.
5. **Search answers platform questions**, not filesystem paths:
   dependencies, EDRs that introduced rules, applicable standards, blast
   radius of DNA/entity changes, pattern/capability reuse.
6. **Out of scope for Sprint 2 (next releases):** SDK package surface (v1.6),
   Plugin Runtime (v1.6), Agent Runtime (v1.7), multi-pilot generalization
   (v1.8+). Order per CTO review and EDR-003 (SDK before mass skills).
7. **Release line:**
   - v1.4 Architecture Validated ✅
   - v1.5 Infrastructure Complete (this EDR)
   - v1.6 SDK + Plugin Runtime
   - v1.7 Agent Runtime
   - v1.8 Development Factory
   - v1.9 Template Ecosystem
   - v2.0 Public Platform

## Trade-offs
In-memory defaults mean production durability waits on adapters — accepted;
contracts and schema are the durable deliverable of v1.5.

## Consequences
- All platform queries go through Foundation APIs.
- Dependency Graph §9.6 becomes a mandatory acceptance test.
- Future SDK (`@grabber/sdk`) wraps these services; nothing imports private
  runtime modules from outside `runtime/src/services`.

## Related Standards
AP-01..AP-05 (API contracts), DB-03 (schema naming), OB-09/OB-10 (telemetry),
AR-11/DC-08 (DNA change regeneration), Article II (event/query coupling).

## Related Components
runtime/src/services/*, runtime/src/storage/*, runtime/test/sprint2.test.js.

## Review Trigger
Sprint 2 complete when: eight services + graph impact test green, storage
SCHEMA documented, MASTER/PLAYBOOK/Capability Registry updated to v1.5.
