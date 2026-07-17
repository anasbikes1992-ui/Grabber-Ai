# Grabber AI Studio — Product Constitution

**Status:** IMMUTABLE north star (change only via dual-approved EDR).  
**Audience:** Every AI component, engineer, and future contributor.  
**Version:** Operating Philosophy v4 (frozen)  
**Execution plan (living):** [EXECUTION-ROADMAP.md](./EXECUTION-ROADMAP.md)  
**Date:** 2026-07-17  

This document is the **CTO / internal constitution**. It does **not** list weekly build tasks—that lives in the Execution Roadmap.

---

## Vision (on the wall)

> **Grabber AI Studio is an AI-native consulting and delivery company that combines expert business consulting, evidence-based decision intelligence, industry knowledge, and a deterministic software factory to transform business challenges into production-ready digital systems.**

Software is **one stage**. Everything before it is **consulting**. Everything after it is **operations**.

Clients buy the outcome of an **AI-native consulting company**—not a chat with a single assistant. Jarvis **coordinates** consulting capabilities (analysis, architecture, finance, security, delivery, support).

---

## Frozen forever (pipeline)

```
Grabber Core          → Frozen
Jarvis                → Consulting Intelligence
Factory               → Manufacturing (never thinks)
Knowledge             → Competitive Advantage
Evidence              → Truth
Memory                → Client continuity

Projects → improve Knowledge → improves Jarvis → Better Projects
```

```
Business
  → Consulting Intelligence
  → Business / Project DNA
  → Factory
  → Application
  → Deployment
  → Evidence (+ Memory)
  → Knowledge
  → Better Consulting
```

**Stop redesigning the architecture. Start accumulating evidence.**

---

## Frozen architecture vs living business assets

| **Frozen** (EDR only) | **Living** (evolve with operational evidence) |
|------------------------|-----------------------------------------------|
| This Constitution | Playbooks & industry packs |
| Product Model | Knowledge graph nodes/edges |
| Grabber Core | Modules & quality levels |
| Product Factory **interfaces** | Blueprints |
| Governance principles | Decision evidence & lessons |
| DNA-only factory input | KPIs, commercial templates |
| Evidence integrity rules | Evidence **values** (counts, outcomes) |
| Factory-never-thinks | Client **Memory** records |

Improving a playbook is **not** architecture. Do not freeze living assets.

---

## Competitive advantage (the moat)

Not AI alone. Not the factory alone. Not modules alone.

```
Industry Knowledge
  + Business Methodology
  + Decision Intelligence
  + Evidence Database
  + Reusable Modules
  + Deterministic Factory
  + Delivery Experience
```

Every completed project strengthens several of these at once.

A chatbot with consulting prompts is copyable in a weekend.  
**Knowledge + methodology + evidence + deterministic delivery** is not.

---

## Immutable principles

### 1. Core freeze

Grabber Core remains frozen unless an EDR shows measurable improvement (reliability, security, determinism, cost, performance) + golden regression.

### 2. AI Consulting Company (not “AI coding tool”)

Jarvis is **consulting intelligence** for an AI-native consulting company—not a code generator, not a single chatbot persona as the product.

### 3. Outcomes, not AI features

Clients purchase **business outcomes**.

### 4. Factory never thinks

```
Never:  LLM → Generate Application
Always: Business → Consulting → DNA → Factory → Application
```

LLMs (when present) improve **upstream** intelligence and DNA quality. Pure builders consume DNA only. Intelligence never lives inside the factory.

### 5. Reasoning vs verification

Recommended stack:

```
Knowledge Graph → Playbooks → Business Rules → Evidence
  → Reasoning Engine (LLM, when available)
  → Verifier (deterministic)
  → Decision Intelligence
  → Recommendations
```

The LLM **reasons**. A deterministic layer **validates**. Hallucinations must not ship as unguarded recommendations.

**Fallback (always):**

```
API available   → LLM reasoning → Verifier → DNA path
API unavailable → Deterministic rules → DNA path
```

### 6. Evidence integrity (sacred)

Evidence fields are written **only by the Evidence Engine, from closed loops**—never by the reasoning layer, never by the LLM.

At zero history, proposals **must** render honestly:

```
Observed in:  0
Based on:     0 completed projects
Evidence:     this interview only
```

Ship the honest zero-state. Fabricated provenance is unrecoverable.

### 7. Evidence strength (living scores, frozen scale)

| Level | Meaning |
|-------|---------|
| Weak Evidence | Interview / assumption only |
| Moderate Evidence | Playbook + patterns |
| Strong Evidence | Multiple projects / measured outcomes |
| Enterprise Proven | Repeated delivery + regression + outcomes |

Lifecycle:

```
Recommendation → Client Accepted → Implemented
  → Measured Outcome → Evidence Score → Knowledge Updated
```

### 8. DNA is the only factory input

No ad-hoc builds from chat or side channels.

### 9. No build without governance

Internal + client approval as required; deposit when commercial terms require it.

### 10. Knowledge compounds + Memory

Every completed project contributes reusable knowledge.  
Every engagement also writes **structured Client Memory** (profile, problems, decisions, DNA, modules, lessons, ROI)—not raw chat dump—so returning clients are known.

### 11. Knowledge is a Business Operating System graph

Not “Textile app.” **Business Operating Systems**, with industries as knowledge packs:

```
knowledge/
  industries/
    textile-wholesale/   # or wholesale-distribution
    hospitality/
    manufacturing/
    construction/
    healthcare/
    logistics/
  …
```

Deepen **few** industries (four world-class beats forty average). Width is earned from real projects—never assumptions.

### 12. Regression for production-facing factory/module changes

### 13. Claims require operational evidence

Use architected / scaffolded / ready for validation until proven.

### 14. Feature justification rule

> No feature is added because it is interesting. Every feature must be justified by evidence from real operations, improve a measurable business outcome, and strengthen the consulting-to-delivery lifecycle.

### 15. No new conceptual layers

Architecture is at endpoint. Refine quality; do not invent layers.

### 16. Sacred metric — Cycle Time

```
Business Challenge → DNA → Approved → Production → Success → Knowledge Added
```

At n=0 it is unmeasurable—first win is **did the loop close?** Optimize later.

---

## Enterprise 1.0

Defined in [ENTERPRISE-1.0.md](./ENTERPRISE-1.0.md): one real client, full lifecycle, acceptance, knowledge feedback, **no governance bypass**.

---

## Operational readiness (snapshot lives elsewhere)

Gate definitions: [OPERATING-READINESS.md](./OPERATING-READINESS.md)  
**Current snapshot** (evolves weekly): [CURRENT-READINESS.md](./CURRENT-READINESS.md)

Do not put ephemeral “zero clients / zero LLM” language in this Constitution.

---

## Amendment process

1. EDR under `decisions/`  
2. Metric + risk stated  
3. Dual human approval (product + engineering)  
4. Update this file only after approval  

Default: reject amendments that add architecture without operational evidence.
