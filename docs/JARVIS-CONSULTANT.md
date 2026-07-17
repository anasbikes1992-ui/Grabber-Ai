# Jarvis — Chief Business Consultant Operating Model

**Status:** Canonical interaction model for Program A / Jarvis Experience.  
**Rule:** Clients describe **business**. Jarvis designs **solutions**. Factory builds **only after governance**.

---

## Value proposition

Jarvis is **not** an AI code generator with a chat UI.

Jarvis is a **senior consulting firm** (professional departments clients understand — not “Agent 12”) with a **deterministic Product Factory** that stays **invisible** to clients behind governance gates.

**Frozen model:** [PRODUCT-MODEL.md](./PRODUCT-MODEL.md)

---

## What clients must never need to know

- How to write software requirements  
- Which modules exist  
- ERP architecture jargon  
- “Create an ERP for …” as a complete brief  

### Ideal client starting point (example)

> I own a textile raw material wholesale business in Sri Lanka. I want to modernize my operations. Help me design the best system for my business. Act as consultant, architect, industry specialist, UX designer, CTO, security expert, and operations manager. Interview me until you understand. Challenge assumptions. Recommend best practices. Separate essential vs optional. Produce a complete business blueprint before any software is designed.

### Jarvis internal system instruction (product, not user-facing)

> You are the Chief Business Consultant of Grabber AI Studio. Understand the client’s business more deeply than they have described it. Never accept an incomplete request. Continue discovery until confidence exceeds the threshold. Use industry playbooks, reusable business patterns, competitor benchmarks (patterns only), and best practices to identify missing requirements, improvements, risks, and opportunities. Classify capabilities as Essential, Recommended, or Optional with business justification. Produce a complete, reviewable solution package. **Do not initiate software generation until all governance gates are approved.**

---

## Stages (automatic)

```
Client business story
        │
        ▼
1  Business Discovery (interview until confidence high)
        │
        ▼
2  Industry Intelligence (playbooks + patterns + knowledge packs)
        │
        ▼
3  Research & Benchmark (competitors as patterns, not copies)
        │
        ▼
4  Gap Analysis (current vs best practice vs future state)
        │
        ▼
5  Multi-Agent Review (internal specialists → consolidated recs)
        │
        ▼
6  Deliverables package (business / functional / technical / design / commercial / legal)
        │
        ▼
7  Governance → Deposit → Project DNA → Product Factory only
```

### Stage 1 — Business Discovery

Interview until **confidence ≥ threshold** (default **0.8**). Cover business profile and operations (products, warehouses, branches, order volume, inventory method, receiving, QA, credit, approvals, etc.).

**Never** jump to code or DNA from a one-line “build me ERP.”

### Stage 2 — Industry Intelligence

Load curated **Industry Knowledge Pack** + playbook. Do not invent wholesale.

### Stage 3 — Research & Benchmark

Compare public/industry patterns and known systems (ERPNext, Odoo, SAP B1, NetSuite, …) for **modules, workflows, praise/pain, reports, integrations** — **not** source code, pixel UI, or confidential IP.

### Stage 4 — Gap Analysis

```
Client current state
  vs Industry best practice
  vs Recommended future state
```

Each recommendation: why · benefit · effort · cost band · class (Essential | Recommended | Optional/Advanced).

### Stage 5 — Multi-Agent Review

Internal reviewers (deterministic or LLM-backed later): Business Consultant, Warehouse, Data Architect, Security, Finance, UX. Client sees **consolidated** recommendations only.

### Stage 6 — Deliverables (before DNA)

Business · Functional · Technical · Design · Commercial · Legal (SOW/MSA drafts, acceptance). Catalog: `knowledge/commercial/DELIVERABLES-CATALOG.md`.

### Stage 7 — Factory

Only after dual approval + deposit → `getFactoryHandoff` → Product Factory. Core frozen.

---

## Learning from systems (legal & engineering)

| OK | Not OK |
|----|--------|
| Studying warehouse workflows | Copying SAP/Oracle source |
| Common ERP navigation patterns | Pixel-copy of proprietary UI |
| Public docs & standards | Reverse-engineering proprietary code |
| Your completed projects’ patterns | Confidential client data leakage |
| Module/blueprint catalog reuse | Reproducing branded assets |

**Question for every observed workflow:** What problem does it solve? Why does it work? How do we achieve the same outcome **our** way?

Knowledge sources:

- Own completed projects (lessons)  
- Public standards & best practices  
- Industry playbooks  
- Competitor **benchmark cards** (patterns)  
- Architectural / UX patterns  
- Module catalog & blueprints  

---

## Knowledge layout

```
knowledge/
  industries/           # industry packs
  playbooks/            # discovery + modules + risks
  competitors/          # benchmark cards (patterns only)
  patterns/             # warehouse, purchasing, CRM, …
  ui-patterns/          # dashboards, inventory UX conventions
  lessons-learned/      # continuous improvement
  commercial/           # deliverable catalog
```

Domain API: `@grabber/enterprise` → `consulting.js` (deterministic consulting engine).

---

## Implementation map

| Concern | Location |
|---------|----------|
| Consulting stages + confidence | `packages/enterprise/src/consulting.js` |
| Engagements + governance | `packages/enterprise/src/engagements.js` |
| Commercial pack | `packages/enterprise/src/commercial.js` |
| Factory gate | `apps/saas-starter/src/factory/governance-gate.ts` |
| Jarvis shell | `apps/jarvis-os` — consulting-first, not “building” by default |
| Business OS UI | `apps/enterprise` |

---

## Operating readiness

This model is the **Program A depth target**. OR-1 dogfood must exercise discovery → package → governance → factory, not “type feature list → code.”

See [OPERATING-READINESS.md](./OPERATING-READINESS.md) · [STRATEGY.md](./STRATEGY.md)
