# EDR-001 — Architecture Freeze v1.2

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Owner** | Anaz |
| **Date** | 2026-07-15 |
| **Project** | platform |
| **Stage** | improvement |

## Context
Documentation maturity reached 10/10 across all domains (Vision, Constitution,
Standards, Jarvis Core, Knowledge Engine, Context Engine, Artifact Model,
State Machine, Validation Runtime, Runtime Architecture, Execution Engine).
The remaining risk is analysis paralysis, not missing documentation.

## Problem
When does architecture stop and implementation begin — and under what rule
may architecture change afterward?

## Alternatives
1. Continue specifying (Prompt OS doc, agent docs, more phases) — rejected:
   produces documents without executable counterparts, violates the
   stop-writing-documents rule.
2. Freeze with exceptions by judgment — rejected: judgment drifts.

## Decision
Architecture is **frozen at v1.2**. Documents 00–07, the Constitution, and
the 19 standards are **immutable contracts**. Rule: **NO NEW ARCHITECTURE
unless implementation exposes a flaw** — and then only via an Accepted EDR.
Every future request is "Build Runtime Component X" or "Validate Runtime
Component Y". Two sanctioned additions enter as runtime components (not new
architecture documents): **Policy Engine** and **System Health Monitor**.

Roles: Claude = Chief Software Architect (architecture review, design review,
runtime validation, EDR review, standards compliance, governance; may also
write production-quality code from approved specifications — never invent
architecture). Antigravity = Lead Platform Engineer (runtime services,
interfaces, APIs, pipelines, templates, Agent Runtime). Codex = Senior
Software Engineer (code generation, refactoring, testing).

Sprint order: Sprint 1 = six runtime services (context, execution,
validation, events, artifacts, state-machine) — no UI, no dashboard.
Sprint 2 = infrastructure services as APIs (Knowledge, Decision, Capability,
Pattern, DNA, Rule). Sprint 3 = Agent Runtime (one Agent Interface;
individual agents become configurations).

## Trade-offs
Slower to add concepts; genuinely missing architecture must first prove
itself as an implementation flaw.

## Consequences
The project is now a software implementation project. The runtime owns
execution, scheduling, events, memory, knowledge, validation, routing,
artifacts, logging, telemetry — agents own nothing.

## Assumptions
Docs 04–07 are implementable as written. Any contradiction found during
implementation is a "demonstrated flaw" and reopens the specific section via EDR.

## Risks
Frozen spec may contain latent ambiguities → mitigated by the Sprint 1
acceptance tests (docs/04 §9) exercising every contract.

## Related Standards
GT-07 (versioning), 18-PROMPT (unchanged), all gates (01-OS §3).

## Related Components
runtime/* (all), Capability Registry entries for runtime components.

## Related Knowledge
docs/04–07, constitution/ENGINEERING-CONSTITUTION.md.

## Review Trigger
Completion of Sprint 1 acceptance criteria, or any implementation-exposed flaw.
