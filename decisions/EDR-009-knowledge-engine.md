# EDR-009 — Knowledge Engine Governance

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Owner** | Anaz |
| **Date** | 2026-07-17 |
| **Project** | platform |
| **Stage** | production |

## Context
EDR-008 mandates evidence capture from the first consultation and lessons on
every project regardless of outcome. What was never defined: what qualifies as
knowledge, who governs it, and how it matures into reusable assets. Without
governance, the knowledge base becomes an unreliable notes folder instead of
the company's moat.

## Problem
Define the rules of the Knowledge Engine — not its implementation.

## Decision

### 1. What becomes knowledge
Only **earned** information (Constitution integrity rules):
- Evidence: accepted/rejected proposals, objections, reasons, industry,
  company size, requested features, outcomes, ROI when measured.
- Lessons: what worked, what failed, why — **success and failure equally**.
- Delivery facts: stack, modules used, timeline, cost, intervention count.
- Never: assumptions, invented benchmarks, unverified claims.

### 2. Who writes / who edits
| Action | Role |
|---|---|
| Record evidence & lessons | Anyone on the engagement (mandatory at Knowledge Gate) |
| Curate / merge / edit | Owner (curation authority) |
| Delete | Owner only, with recorded reason |
| Consume | All systems and roles (Jarvis recommendations, Orchestrator planning) |

### 3. What is evidence vs. opinion
Evidence has: source engagement · date · observable fact · strength score.
Anything missing one of those is opinion and is stored as a *hypothesis*,
never used to justify a client recommendation.

### 4. Expiry and confidence
- Every knowledge item carries a confidence score and last-verified date.
- Confidence **increases** when new engagements confirm it; **decreases**
  when contradicted or unused past its review window.
- Stack- and price-sensitive knowledge expires after 12 months unverified;
  behavioral/industry knowledge after 24. Expired items demote to hypothesis.

### 5. Promotion ladder
```
Evidence → Lesson → Pattern (seen ≥2 engagements)
  → Module      (working reusable implementation, extracted at Knowledge Gate)
  → Blueprint   (module set + architecture proven in ≥2 deliveries)
  → Playbook    (repeatable end-to-end delivery recipe, proven ≥3 times)
```
Promotion requires the evidence threshold — never enthusiasm. Demotion is
allowed and expected.

## Trade-offs
Curation overhead on the Owner; accepted — a small verified base beats a
large unverified one.

## Consequences
- Knowledge Gate (QUALITY-GATES §10) cannot pass without recorded lessons.
- Jarvis recommendation strength is bounded by knowledge confidence scores.
- The module library grows only through the promotion ladder.

## Related Standards
EDR-008 §5.5, QUALITY-GATES §10, Constitution evidence integrity rules.

## Related Components
knowledge/*, runtime/ (knowledge graph), docs/SYSTEMS.md.

## Review Trigger
After 3 completed engagements: audit whether the ladder produced at least one
promoted module and whether any expired/demoted item was still being cited.
