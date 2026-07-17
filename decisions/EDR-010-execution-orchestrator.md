# EDR-010 — Execution Orchestrator Responsibilities

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Owner** | Anaz |
| **Date** | 2026-07-17 |
| **Project** | platform |
| **Stage** | production |

## Context
EDR-008 §4 introduced the Execution Orchestrator as an orchestration policy on
the existing IEP/execution-engine (EDR-006/007). This record fixes its
responsibilities **before** implementation, to prevent scope creep. It defines
responsibilities only — not implementation.

## Problem
Without a fixed responsibility boundary, the Orchestrator will absorb
consulting logic, factory logic, or governance logic it must not own.

## Decision

### 1. Pipeline (the only flow the Orchestrator owns)
```
Input: Approved consultation
  → Business DNA
  → Project DNA
  → Task Graph
  → Module Selection (library first — Article III)
  → Developer Assignment
  → Factory Planning
  → Quality Gates
  → Deployment
  → Knowledge Capture
```

### 2. Responsibilities (exhaustive)
1. Accept **only** approved consultations with complete Business DNA.
2. Break work into verifiable units with explicit dependencies.
3. Select reusable modules before scheduling new builds.
4. Assign builders and reviewers per unit.
5. Track state, retry failed units, escalate blocked ones.
6. Enforce gate order (QUALITY-GATES); block deployment until all pass.
7. Trigger Knowledge Capture at completion — success or failure.

### 3. Explicit non-responsibilities
- Does **not** conduct or alter consultations (Jarvis owns that).
- Does **not** generate code or artifacts (Factory owns that).
- Does **not** approve anything (humans own approvals).
- Does **not** define gates (QUALITY-GATES owns that).
- Does **not** invent new conceptual layers — it executes work.

### 4. Contract rules
- Every input and output is a structured artifact, never free-form text.
- Every state transition is logged and auditable.
- Automation within the Orchestrator must eliminate manual effort
  **without reducing governance** (EDR-008 constitutional rule).

## Trade-offs
Fixed boundaries may feel restrictive during implementation; accepted —
boundary changes require amending this EDR, which is the point.

## Consequences
- Implementation lives in `runtime/src/orchestration` on the existing engine.
- Any feature request for the Orchestrator is tested against §2/§3 first.
- P3 AI-team orchestration (EDR-008 §5.6) plugs into §2.4 assignment — no new
  responsibilities.

## Related Standards
EDR-006, EDR-007, EDR-008 §4, QUALITY-GATES, Article III (reuse).

## Related Components
runtime/src/orchestration, runtime/src/factory, docs/SYSTEMS.md.

## Review Trigger
First real engagement flowing through the pipeline end-to-end; amend only if a
concrete responsibility gap is proven by that engagement.
