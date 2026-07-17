# Grabber Product Factory v2.0 — SaaS Starter host

**Track B commercial product surface** on **frozen Grabber Core**.  
Pipeline: DNA → assembly → Core build → integrations → metrics.

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS 4
- Supabase Auth (with **demo mode** when env is unset)
- Playwright e2e
- ESLint

## Quick start

```bash
cd apps/saas-starter
cp .env.example .env.local   # optional — leave empty for demo auth
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → **Sign in** with any email + password (6+ chars) in demo mode.

### Live Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Set in `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Enable Email auth in Supabase dashboard.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local dev (Turbopack) |
| `npm run build` | Production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run test:e2e` | Playwright (starts dev server) |

## Deploy (Vercel)

```bash
# from apps/saas-starter
npx vercel
```

Set the same env vars in the Vercel project. Root directory: `apps/saas-starter` if monorepo-linked.

## Product DNA

See `project-dna.json` (aligned with `templates/products/saas-starter`).

## Sprint 1 DoD

- [x] Next.js + Tailwind + TypeScript
- [x] Supabase client integration + demo auth fallback
- [x] Login / signup / dashboard layout
- [x] `tsc --noEmit` passes
- [x] Playwright auth smoke test
- [x] Prompt OS skeleton at repo `grabber-prompt-os/`
- [ ] GitHub remote + Vercel preview (operator step)

## Sprint 2 — Product Intelligence Layer

Product-side only. **No second orchestrator.**

```
Client request → Discovery → Requirements → Feature classification
  → Project DNA → builder job handoff → Grabber Core Product Factory
```

| Path | Role |
|------|------|
| `prompt-os/` | Versioned product prompts |
| `schemas/` | JSON contracts |
| `jobs/builder-manifest.json` | Core builder job list |
| `handoffs/` | Step handoff schemas |
| `src/intelligence/` | Pipeline implementation |
| `POST /api/intelligence/run` | HTTP entry |
| `/dashboard/intelligence` | UI |

```bash
npm run test:intelligence
# optional wall-KPI path:
curl -X POST http://localhost:3000/api/intelligence/run \
  -H "content-type: application/json" \
  -d '{"text":"Multi-tenant SaaS with billing and invites","name_hint":"demo","submit_to_core":true}'
```

## Sprint 3 — Intake produces Project DNA

```
Conversation → Discovery → Requirements → Features → Modules → Domain
  → Architecture → Rich DNA → Cost → Review → Approve → Core
```

| Path | Role |
|------|------|
| `src/intake/` | Deterministic intake pipeline |
| `POST /api/intake/run` | DNA + scores + optional Core submit |
| `/dashboard/intake` | Wizard + confidence bars + human review |

**Gate:** `ready_for_build` requires confidence/completeness thresholds; otherwise clarifications only — **no Core submit**.

```bash
npm run test:intake
```

KPIs: DNA completeness %, confidence %, clarifications, builder warnings, validation errors.

## Sprint 4 — Integration Layer (DNA-driven)

```
DNA → Integration Planner → GitHub / Supabase / Stripe / Vercel → Production URL
```

| Path | Role |
|------|------|
| `src/integrations/` | Planner + providers (dry-run without secrets) |
| `src/metrics/` | Factory metrics JSONL + rollups |
| `GET /api/metrics` | Metrics API |
| `/dashboard/metrics` | Metrics UI |

After approve+submit: Core build → integration plans → planned production URL.

```bash
npm run test:integrations
```

## Sprint 5 — Business Module Assembly

```
DNA.modules[] → Compatibility → Factory Registry → Assembled capabilities → Core
```

| Path | Role |
|------|------|
| `modules/` | Versioned business modules + `registry.json` |
| `src/modules/` | Registry, compatibility, assembler |
| `POST /api/modules/assemble` | Assemble from DNA selection |
| `/dashboard/modules` | Catalog + reuse demos |

**Module Reuse Rate** is recorded on every Core submit.

```bash
npm run test:modules
```

## Sprint 6 — Reference Product: Booking

Declarative DNA + blueprint → catalog assembly → Core → regen → integration plan.

```bash
npm run test:booking    # Booking + golden suite (saas/crm/marketplace/booking)
npm run test:factory    # Full Track B factory suite
```

| Path | Role |
|------|------|
| `blueprints/` | Product recipes (saas, crm, marketplace, **booking**, inventory) |
| `reference-projects/booking/` | Golden Booking DNA |
| `src/blueprints/` | Materialize + reference runner |
| `/dashboard/blueprints` | Blueprint UI |
| `POST /api/reference/run` | `{ "product": "booking" \| "all" }` |

**Operating model:** platform complete — grow catalog, not Core.
