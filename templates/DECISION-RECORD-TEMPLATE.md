# ENGINEERING DECISION RECORD (EDR) TEMPLATE

Every meaningful decision — architectural, technical, process, or business —
is recorded in `/decisions` as `EDR-NNN-<slug>.md`. Jarvis consults EDRs
before proposing changes; this preserves architectural intent over time.
No magic. No hidden reasoning.

EDRs supersede plain ADRs: they link decisions to standards, components, and
knowledge, making them graph nodes (03-KNOWLEDGE-ENGINE §2), not just prose.

---

# EDR-NNN — <Title>

| Field | Value |
|-------|-------|
| **Status** | Proposed / Accepted / Superseded by EDR-… / Deprecated |
| **Owner** | |
| **Date** | |
| **Project** | (or "platform") |
| **Stage** | lifecycle stage (01-OPERATING-SYSTEM §1) |

## Context
The situation requiring a decision.

## Problem
The specific question being answered.

## Alternatives
Each alternative with the reason it was rejected.

## Decision
What was decided, in one or two sentences.

## Trade-offs
What we accept as the cost of this decision.

## Consequences
What becomes easier, harder, or newly required.

## Assumptions
Conditions under which this decision is valid. If one breaks, revisit.

## Risks
Known risks introduced and their mitigations.

## Related Standards
Standard rule ids this decision relies on or excepts (e.g., AR-06, S-03).

## Related Components
Components, patterns, and artifacts affected (become graph edges).

## Related Knowledge
Knowledge entries consulted or produced.

## Review Trigger
Event or date that forces re-evaluation.
