# EDR-007 — Product Factory & Dual-Track Operating Model (v1.8)

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Owner** | Anaz |
| **Date** | 2026-07-15 |
| **Project** | platform |
| **Stage** | product |

## Context
v1.0–v1.7 completed Grabber AI Studio **Core**. CTO sign-off: platform core is
complete (not feature-complete). KPIs shift from “build the platform” to
“use the platform to build products.”

## Problem
Continue platform expansion, or start product engineering on a frozen core?

## Alternatives
1. More platform features (portals, marketplace, 200 skills) — rejected: dilutes
   the DNA→product proof.
2. Call v1.8 “Development Factory / code gen” — rejected: factory produces
   **complete products**, not just code.
3. **Product Factory + dual tracks** — chosen.

## Decision
1. **Platform core is frozen for growth-by-extension.** Track A changes only
   when implementation reveals genuine gaps (EDR required).
2. **v1.8 name:** Product Factory (not Development Factory).
3. **Dual tracks:**
   - **Track A — Platform Engineering:** runtime, SDK, CLI, IEP, validation,
     knowledge, policies, security, monitoring (slow change).
   - **Track B — Product Engineering:** Product Factory, domain products,
     templates, reference projects (fast iteration).
4. **Artifact Builders** are deterministic pipeline steps (not agents):
   PRD, Architecture, API, Database, Frontend, Backend, Test, Security,
   Deployment, Documentation. IEP schedules them as jobs.
5. **Three production templates only:** SaaS Starter, CRM, Marketplace.
6. **Reference projects** (`reference-projects/`) are the regression suite:
   regenerate twice → equivalent artifacts, validation pass, cost budget,
   zero intervention, replayable.
7. **Wall KPI:** time from Project DNA to validated deployable application
   (plus intervention rate, cost, validation pass, reuse rates).
8. **Skills:** deepen first-party quality (manifest + actions + knowledge +
   patterns + tests + docs) — not mass expansion. Priority connectors:
   GitHub, Supabase, Vercel, PostgreSQL, Docker, Stripe.
9. **Extension marketplace** waits until three internal products prove Core.
10. **Feature filter:** ship only if it improves DNA→production reliability,
    lower intervention, or lower cost.

## Trade-offs
Builders emit structured product blueprints (specs + file manifests), not
full vendor-deployed apps in v1.8 — enough to prove product generation and
regression; deeper codegen can refine without architecture change.

## Consequences
- Product engineering owns templates and reference projects.
- Platform team rejects new architecture without EDR.
- CLI primary DX: `grabber create|plan|build|validate|deploy`.

## Related Standards
AR-11, DC-08, TS-03, DO-09, OB-09, Article III (reuse).

## Related Components
runtime/src/factory/*, templates/products/*, reference-projects/*, packages/cli.

## Review Trigger
v1.8 done when: Product Factory regenerates three templates twice with
equivalent artifacts, validation pass, cost recorded, replay OK, zero
manual intervention in automated runs; MASTER → 1.8.0.
