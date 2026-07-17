# EDR-006 — Intelligent Execution Platform (v1.7)

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Owner** | Anaz |
| **Date** | 2026-07-15 |
| **Project** | platform |
| **Stage** | architecture |

## Context
v1.6 completed the Platform Extension Framework. The natural temptation is to
build agents next. CTO guidance: build the **execution environment** first
(Docker before containers). Agents become configuration loaded by that
environment, not the center of the architecture.

## Problem
Ship “Agent Runtime” alone, or ship infrastructure that makes agents replaceable jobs?

## Alternatives
1. Agent Runtime only — rejected: hardcodes sequential agent-centric flow.
2. Full cloud mesh (K8s-scale) now — rejected: premature ops complexity.
3. **Intelligent Execution Platform (IEP)** — chosen: scheduler, queue, locks,
   sessions, memory, cost, metrics, recorder, then agent runtime as config.

## Decision
1. **v1.7 name:** Intelligent Execution Platform (not “Agent Runtime”).
2. **Core modules** (in `runtime/src/iep/`):
   scheduler, queue, orchestrator, executor, locks, sessions, cache, memory,
   cost, metrics, telemetry integration, **runtime recorder** (replay).
3. **Agents are YAML/JSON configuration** loaded by Agent Runtime host:
   role, permissions, skills, connectors, workflows, policies, memory,
   budget, models, validators — not bespoke codebases.
4. **Agent lifecycle** (Agent SDK): initialize → prepare → buildContext →
   execute → validate → publish → learn → shutdown.
5. **Execution pipeline:** Scheduler → Priority Queue → Dependency Resolver →
   Executor → Validation → Publish → Metrics/Cost/Recorder.
6. **Memory as a Service** layers: working, project, knowledge, organization,
   personal — separate stores, same API.
7. **Runtime Recorder:** every execution is replayable (context, events,
   artifacts, decisions, validation, outputs, duration).
8. **No new architecture concepts** beyond this EDR and frozen docs 04–07.
   Artifact Builders / templates remain v1.8 unless needed for IEP tests.
9. **Engineering metrics** (not file counts) are first-class: reliability,
   coverage of IEP paths, cost, retry, policy violations, intervention rate.

## Trade-offs
In-memory queue/locks for reference implementation — same contract pattern as
v1.5 storage (swap later without business logic changes).

## Consequences
- ExecutionEngine remains for stage workflows; IEP orchestrates jobs and may
  drive stage tasks as jobs.
- Model vendors stay behind executor adapters; cost engine records estimates.

## Related Standards
OB-09, OB-10, EH-09, RT-01 (replay), RT-02 (no business intelligence in engine),
Article V (provenance), Article IX (audit).

## Related Components
runtime/src/iep/*, packages/agent-sdk, runtime/test/iep.test.js.

## Review Trigger
v1.7 done when: job pipeline green, memory layers queryable, cost+metrics
attached to executions, recorder can replay, agent config loads and runs
lifecycle, MASTER → 1.7.0.
