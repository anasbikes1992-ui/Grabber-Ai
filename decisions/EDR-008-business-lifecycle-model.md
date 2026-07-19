# EDR-008 — Business Lifecycle as Primary Mental Model; Business/Project DNA Split; Layer Renames; Success Engine

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Owner** | Anaz |
| **Date** | 2026-07-15 |
| **Project** | platform |
| **Stage** | improvement |

## Context
The platform (v1.8) is technically complete for its scope, but is explained
in engineering terms ("Track A / Track B"). Running the business requires a
model that clients, developers, and future employees understand without
translation.

## Problem
How should the platform be explained and organized so operation matches how
the business actually thinks?

## Decision
**No architecture changes.** Four organizational/conceptual changes:

1. **The Business Lifecycle becomes the primary mental model:**
   Acquire → Discover → Analyze → Recommend → Approve → Plan → Build →
   Verify → Deliver → Support → Learn → Improve.
   Every system must map to one or more stages; a feature that maps to none
   is a signal it doesn't belong. Canonical doc: docs/DELIVERY-LIFECYCLE.md.

2. **Two DNAs, two owners:**
   - **Business DNA** — owned by Jarvis (consulting). Company, workflows,
     pain points, goals, KPIs, budget, priorities, timeline, stakeholders.
     No technology.
   - **Project DNA** — owned by the Execution Orchestrator (delivery).
     Architecture, modules, APIs, database, UI, integrations, security,
     deployment, testing, milestones. No business discovery.
   Flow: Business → Discovery → Business DNA → Execution Orchestrator →
   Project DNA → Factory → Application. The existing Project DNA template is
   unchanged; a Business DNA template is added.

3. **Rename the tracks** (self-explanatory names):
   Track A → **Foundation Layer** (runtime, SDK, CLI, engine, policies,
   builders, validation, knowledge contracts — never customer-facing).
   Track B → **Delivery Layer** (website, booking, Jarvis, Business OS,
   portal, proposals, documents, invoices, delivery, support, evidence).
   The two form a loop: Delivery creates DNA → Foundation manufactures →
   Delivery delivers → lessons flow back → Foundation improves.

4. **Add the Success Engine** between deployment and knowledge capture:
   Deploy → Customer Success → ROI Review → Renewal → Referral →
   Case Study → Knowledge. Consulting value is created after deployment.

**Ownership matrix** (removes ambiguity):
Website→Marketing · Jarvis→Consulting · Business OS→Operations ·
Execution Orchestrator→Delivery · Factory→Engineering ·
Client Portal→Customer Success · Evidence Engine→Quality ·
Knowledge Engine→Platform.

## Alternatives
Keep Track A/B naming — rejected: requires explanation, forgotten in six
months. Restructure repositories around the lifecycle — rejected: code
organization is fine; only the explanation layer changes.

## Trade-offs
Docs must be updated to the new vocabulary (scheduled in the Enterprise 1.0
plan, M0); transitional period where both vocabularies appear.

## Consequences
docs/ENTERPRISE-1.0-PLAN.md becomes the operating plan; the Enterprise 1.0
checklist gates the first real customer; advanced features (AI personas,
multi-LLM routing strategies, autonomous coding without review, 3D
interactions, multi-cloud, microservice decomposition) are explicitly
deferred until the checklist completes end-to-end.

## Assumptions
The saas-starter app, Business OS modules, and factory are the substrate for
the Delivery Layer builds.

## Risks
Vocabulary drift during transition → mitigated by DELIVERY-LIFECYCLE.md
being the single source (Rule 1) and MASTER linking to it.

## Related Standards
DC-04 (one home), 13-DOCUMENTATION, 01-OS lifecycle (engineering stages are
the Plan→Verify segment of the business lifecycle).

## Related Components
docs/DELIVERY-LIFECYCLE.md, docs/ENTERPRISE-1.0-PLAN.md,
templates/BUSINESS-DNA-TEMPLATE (M0 deliverable), Business OS, Execution
Orchestrator, Success Engine (new, Delivery Layer).

## Related Knowledge
EDR-007 (dual-track), docs/OPERATING-MODEL.md.

## Review Trigger
Enterprise 1.0 checklist completion, or first real engagement closing.
