# Grabber AI Studio — Operating Model

**Status:** Platform mature (factory). Enterprise **feature scaffold**. Phase = **OR-1 Internal Operation**.  
We aim to **operate an AI software company** — not only an AI code factory.  
Canonical architecture: [ARCHITECTURE-V2.md](./ARCHITECTURE-V2.md)  
Strategy: [STRATEGY.md](./STRATEGY.md) · OR/CR: [OPERATING-READINESS.md](./OPERATING-READINESS.md) · Maturity: [ENTERPRISE-MATURITY.md](./ENTERPRISE-MATURITY.md)

## Hierarchy

```
Grabber Core (engine, FROZEN)
        ↑
Product Factory (manufacturing · one stage)
        ↑
Business OS + Governance (commercial path · Program A priority)
        ↑
Jarvis OS (experience · thin client)
        ↑
Commercial Products (outcomes)
```

## Pipeline (full company — target)

```
Visitor → Consultation → Discovery → Analysis → Solution → Proposal
  → Approval → Deposit → Project DNA → Module Assembly → Core Build
  → Deploy → Client Portal → Support → Maintenance → Renewal
```

Factory-only slice (still valid):

```
Project DNA → Module Assembly → Blueprint → Grabber Core
  → Builders → Integrations → Deployment → Metrics
```

## Track A — Platform (slow)

Grabber Core only. Change only for reliability, validation, cost, security,
determinism, replay, performance. Requires EDR + golden reference regeneration
(saas, crm, marketplace, booking).

## Track B — Products (fast)

Product Factory, modules, blueprints, integrations, customer products, **Jarvis OS**.

## What compounds value

1. Module catalog  
2. Product blueprints  
3. Golden references  
4. Factory metrics  
5. Jarvis experience (**without** reimplementing Core)

## Ultimate filter

If it does not make DNA → production **faster, more reliable, more deterministic,
or lower cost**, it does **not** go in Grabber Core.

If it does not improve a **funnel or ops metric** (STRATEGY.md), it does not ship
as a Track B feature either.

Implement as: product capability · reusable module · Jarvis OS surface · **lesson → asset**.

## Wall KPI (factory slice)

```
Client Idea → Project DNA → Deterministic Assembly
  → Validated Application → Deployment → Production Success
```

## Company KPI (full loop)

```
Lead → … → Support → Renewal
  + Continuous Improvement → Better Next Project
```

## Continuous Improvement

Finished project → reviews → lessons → playbooks / modules / blueprints / discovery.  
See OPERATING-READINESS.md.