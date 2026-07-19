# DELIVERY LIFECYCLE — The Canonical Business Journey

**Status:** Canonical (EDR-008) · **Version:** 1.0.0
This is the primary mental model of Grabber AI Studio. Every system exists
to support one or more of these stages. A feature that maps to no stage
doesn't belong.

---

## The Lifecycle

| # | Stage | What happens | System | Owner |
|---|-------|-------------|--------|-------|
| 1 | **Acquire** | Stranger discovers us, qualifies, books a consultation | Website + Booking | Marketing |
| 2 | **Discover** | Jarvis interviews: company, workflows, pain points | Jarvis | Consulting |
| 3 | **Analyze** | Decision intelligence over discovery data | Jarvis | Consulting |
| 4 | **Recommend** | **Business DNA** created; proposal generated with evidence | Jarvis + Business OS | Consulting |
| 5 | **Approve** | Client approves proposal; contract signed; deposit collected | Business OS | Operations |
| 6 | **Plan** | Business DNA → **Project DNA**; factory planning pipeline | Execution Orchestrator | Delivery |
| 7 | **Build** | Factory manufactures from Project DNA | Factory | Engineering |
| 8 | **Verify** | Gates, policies, human review & QA | Validation Runtime + Human | Engineering |
| 9 | **Deliver** | Production deployment; client sees progress and receives the product | Deployment + Client Portal | Customer Success |
| 10 | **Support** | Issues, requests, milestone approvals, invoices | Client Portal + Support | Customer Success |
| 11 | **Learn** | Success Engine: ROI review → renewal → referral → case study; Evidence Engine captures outcomes | Success + Evidence Engines | Quality |
| 12 | **Improve** | Lessons merged; patterns promoted; Jarvis becomes smarter | Knowledge Engine | Platform |

Then the flywheel turns: a smarter Jarvis acquires and advises better.

## The Two Layers

- **Delivery Layer** (customer-facing, earns revenue): website, booking,
  Jarvis, Business OS, portal, proposals, documents, invoices, delivery,
  support, evidence. Stages 1–5, 9–11.
- **Foundation Layer** (never customer-facing, manufactures software):
  runtime, SDK, CLI, execution engine, policies, builders, validation,
  templates, knowledge contracts. Stages 6–8, 12.

They form a loop: Delivery creates DNA → Foundation manufactures →
Delivery delivers → lessons flow back → Foundation improves.

## The Two DNAs (EDR-008)

```
Business → Discovery → BUSINESS DNA → Execution Orchestrator → PROJECT DNA → Factory → Application
              (Jarvis owns)                                (Orchestrator owns)
```

- **Business DNA**: company, workflows, pain points, goals, KPIs, budget,
  priorities, timeline, stakeholders. **No technology.**
- **Project DNA**: architecture, modules, APIs, database, UI, integrations,
  security, deployment, testing, milestones. **No business discovery.**

The engineering lifecycle (01-OPERATING-SYSTEM §1) is the detailed
expansion of stages 6–9 of this business lifecycle. This document is the
outer loop; that one is the inner loop.
