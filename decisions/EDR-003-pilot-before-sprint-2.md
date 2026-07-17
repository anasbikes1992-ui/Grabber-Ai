# EDR-003 — Pilot Project Before Sprint 2; Revised Sprint Roadmap; Repository Split Target

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Owner** | Anaz |
| **Date** | 2026-07-15 |
| **Project** | platform |
| **Stage** | verification |

## Context
Runtime Sprint 1 is implemented with passing acceptance tests. Architecture is
no longer the bottleneck — implementation is. Tests passing is not the success
criterion; real projects executing is.

## Problem
Build Sprint 2 immediately, or validate Sprint 1 with a real end-to-end run first?

## Alternatives
1. Sprint 2 immediately — rejected: builds services on an unvalidated core.
2. Build a real deployed app manually — rejected: validates the app, not the platform.

## Decision
1. **Pilot first**: a simple project (Task Manager) travels the full runtime —
   Project DNA → Execution Engine → Artifacts → Validation → Deployment →
   Learning → Closed — before any Sprint 2 work.
2. **Success metric** (platform-wide, permanent): *Can a brand-new Project DNA
   file travel through the runtime, produce validated artifacts, satisfy all
   policies, and result in a deployable application with minimal manual
   intervention?* Progress is no longer measured in documents or agents.
3. **Revised sprint roadmap**: 2 = Runtime Services (Knowledge, Rule, DNA,
   Decision, Capability, Pattern, **Artifact Query**, Dependency Graph);
   3 = Agent Runtime (one `Agent` interface: initialize → loadContext →
   execute → validate → publish → learn; agents are configurations);
   4 = Plugin Runtime (skills, connectors, templates, workflows installable);
   5 = SDK (`@grabber/sdk` — all internal consumers use it); 6 = CLI
   (`grabber create/validate/deploy/learn/doctor/plugin/skill/runtime/status`);
   7 = Development Factory and first production template (CRM); then expansion.
4. **Repository split target (v2.0)**: four domains — Core (runtime, SDK, CLI,
   engine), Platform (agent runtime, skills, connectors, plugins, templates),
   Applications (portal, admin, dashboard, marketplace), Knowledge (standards,
   docs, patterns, playbooks). Monorepo packages first; physical split when
   team size demands it.

## Trade-offs
Sprint 2 starts later; pilot agents are deterministic stand-ins (real model
calls arrive with the Agent Runtime, Sprint 3).

## Consequences
Pilot findings are the only sanctioned source of architecture changes
(EDR-001 rule). Each pilot-exposed flaw gets a fix + EDR reference.

## Pilot findings (recorded as they occur)
- **F-1 (SM-06 bypass):** `gatePassed(improvement)` could transition to
  `closed` without the learning-merged check that `close()` enforces.
  Fix: the state machine now applies the SM-06 check on ANY transition into
  `closed`. This is a spec-conformance fix, not new architecture.

## Assumptions
Sprint 1 services are behaviorally correct per docs/04–07 except where pilot
findings say otherwise.

## Risks
Pilot passing with synthetic agents may hide model-behavior issues → accepted;
Sprint 3 re-runs the pilot with real agents.

## Related Standards
TS-03 (criteria→tests), DO-09 (deployment gate), Article VII.

## Related Components
runtime/pilot/, projects/pilot-task-manager/, runtime/src/state-machine/machine.js.

## Related Knowledge
docs/PLAYBOOK.md §7 (sprint roadmap), docs/JOURNEY.md.

## Review Trigger
Pilot completion → green-lights Sprint 2.
