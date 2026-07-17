# EDR-008 — Execution Quality Milestone & Execution Orchestrator (v1.9)

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Owner** | Anaz |
| **Date** | 2026-07-17 |
| **Project** | platform |
| **Stage** | production |

## Context
EDR-007 froze the platform core and proved the Product Factory prototype.
A production-readiness audit (2026-07-17) confirmed:

- **website** / **jarvis-os** — scaffolds; no persistence, no auth, no deploy config.
- **business-os**, **client-portal**, **marketing-intel** — empty placeholders.
- **enterprise** — demo app, in-memory data, hardcoded demo auth.
- **saas-starter** — only app with Supabase client (`@supabase/ssr`), dual-mode
  demo/Supabase auth, `vercel.json`; persistence still file-backed by default.
- **Zero** implemented integrations (Stripe/GitHub/Supabase connectors are
  manifest-only), zero PDF generation, zero CI/CD, zero RLS.
- Runtime Postgres schema fully designed
  (`runtime/src/storage/SCHEMA.md`) but not wired to any app.

The platform has enough capabilities. The risk is now **execution quality**,
not missing features.

## Problem
What is built before, alongside, and after the first real client engagements —
without expanding the architecture again?

## Alternatives
1. Continue capability expansion (3D avatar, omnichannel, AI team) first —
   rejected: delays Enterprise 1.0; nothing is production-safe yet.
2. Jump straight to Factory automation — rejected: no paid engagement has
   validated the consulting loop; automating an unproven pipeline compounds risk.
3. **Three-tier execution plan with an Execution Orchestrator** — chosen.

## Decision

### 1. Work is classified into three tiers
| Tier | Rule |
|------|------|
| **P1 — Must build before real clients** | Production foundation. Blocks client onboarding. |
| **P2 — Build alongside clients** | Premium consulting experience. Ships incrementally during engagements. |
| **P3 — Build only after multiple successful engagements** | Factory automation & scale. Requires evidence from ≥3 paid deliveries. |

### 2. P1 — Production Foundation (blocks real clients)
1. **Deploy** website, business-os, client-portal on Vercel.
   GitHub-connected: `main` → production, `develop` → preview.
2. **Supabase is the production backend.** Implement the designed schema
   (leads, companies, projects, consultations, users, documents, messages,
   invoices, knowledge, evidence, decision briefs). Postgres + Realtime +
   **RLS mandatory**. JSON-file persistence is demo-only (roadmap Stage 3 —
   Production Foundation).
3. **Auth before any real client:** Magic Link + Google + Microsoft + GitHub.
   Roles enforced in middleware/RLS: Owner, Consultant, Developer, Reviewer,
   Finance, Client.
4. **All generated documents** (executive reports, DNA, contracts, invoices,
   uploads) go to Supabase Storage. **Never the filesystem.**

### 3. P2 — Consulting Experience (alongside clients)
1. **Jarvis is a Business Consultant, not a 3D gimmick.** The interface
   (R3F/Three.js/Spline/ReadyPlayerMe/ElevenLabs/Realtime voice) is optional
   skin; the structured 15–20 min discovery interview producing
   analysis → gaps → opportunities → roadmap → investment → ROI → executive
   report is the product.
2. **Omnichannel conversation timeline:** WhatsApp Business first (highest
   ROI), then Messenger/Instagram/Email/website/phone — one customer, one
   timeline, feeding Business OS live. Channel adapters live in
   `connectors/` per the thin-connector contract.
3. **Booking automation:** Calendly/Google Calendar → reminder →
   consultation → proposal, no manual steps.
4. **Commercial automation:** approved consultation auto-generates proposal,
   quotation, SOW, MSA, timeline, invoice, payment link, contract → e-sign →
   deposit → project start.

### 4. Execution Orchestrator (new component, P2/P3 boundary)
A governed layer **between Business OS and the Factory**. Approved business
intent is transformed into executable delivery plans before implementation
begins — it executes work; it is not a new conceptual layer.

```
Consultation → Decision Intelligence → Business DNA
  → Execution Orchestrator
      → Project Plan → Architecture → Task Graph → Agent Assignments
  → Factory → Quality Gates → Human Approval → Production
```

Production never happens directly from the Factory. The Orchestrator breaks
work into verifiable units, assigns builders and
reviewers, tracks dependencies, retries failed steps, and blocks deployment
until all quality gates pass (see `docs/QUALITY-GATES.md`). It builds on the
existing IEP/execution-engine
(EDR-006/007) — it is an orchestration policy, not a new architecture.

**Automation rule (constitutional):** every automation introduced must
eliminate manual effort **without reducing governance**.

### 5. P3 — Factory Automation (after ≥3 successful engagements)
1. **No “zero defects” claims — ever.** The promise is *deterministic,
   traceable, reviewable generation with automated validation and human
   approval gates.*
2. **Verification pipeline, no stage skipped:** generate → compile →
   typecheck → lint → tests → security → accessibility → performance →
   architecture validation → business-rule validation → regression → deploy.
3. **Multi-reviewer gates:** Architect, Backend, Frontend, QA, Security,
   Performance, UX, Documentation — each emits PASS / FAIL / NEEDS-CHANGES;
   merge only on all-pass. Structured output only, never free-form chat.
4. **Auto-generated per project:** PM artifacts (roadmap, tasks, milestones,
   dependencies, risks, budget, timeline, progress) and documentation
   (README, architecture, API docs, ERD, deployment, env, user/admin
   manuals, changelog).
5. **Knowledge Engine capture on every completed project:** industry,
   problem, solution, stack, modules, failures, fixes, timeline, ROI,
   feedback → Knowledge Graph. **Lessons are recorded regardless of project
   success or failure** — failures are often more valuable than successes.
   Every completed implementation must evaluate whether any component
   qualifies for promotion into the reusable module library.
6. **Internal AI team roles** (CEO…Documentation) orchestrated by the
   Execution Orchestrator — only after the human-run loop is proven.

### 6. Analytics Dashboard (business health)
Track: lead→consultation, consultation→proposal, proposal→paid conversions;
**average proposal acceptance rate** (the commercial KPI);
delivery cycle time; client satisfaction; module reuse rate; evidence
strength per recommendation; revenue by industry; consultant utilization.

### 7. Milestone order (Enterprise 1.0 path)
1. Production deployment (Vercel + Supabase + Auth + Storage)
2. Premium consulting experience (Jarvis UI, booking, WhatsApp, calendar, executive reports)
3. End-to-end consulting validation — first **paid** blueprint delivered.
   This milestone satisfies **Enterprise 1.0** (see `docs/ENTERPRISE-1.0.md`).
4. Execution Orchestrator — approved consultations → structured, gated plans
5. Factory automation — gradual, deterministic, human-approved for production

## Trade-offs
- 3D/voice experience deferred behind the intelligence layer: slower “wow,”
  faster trust.
- Factory automation gated on 3 paid engagements: slower automation, but
  automation trained on real evidence instead of assumptions.
- Supabase is the **reference implementation**. Persistence remains behind
  storage interfaces (`runtime/`) so future adapters remain possible.

## Consequences
- No real client PII enters the system before P1 is complete (roadmap Stage 3 —
  Production Foundation — is a blocking gate, not advisory).
- `business-os` and `client-portal` move from placeholder to build-now.
- All document generation targets Supabase Storage from day one.
- Any new capability request is answered with its tier; P3 items are
  rejected until the engagement threshold is met.

## Related Standards
Article III (reuse), Stage 3 (Production Foundation), COMMERCIAL-GATES,
DELIVERY-GOVERNANCE, QUALITY-GATES, ENTERPRISE-1.0,
EVIDENCE integrity rules (Constitution).

## Related Components
apps/website, apps/business-os, apps/client-portal, apps/saas-starter,
runtime/src/storage (SCHEMA.md), runtime/src/orchestration, connectors/*,
docs/EXECUTION-ROADMAP.md.

## Review Trigger
- **P1 done:** three apps live on Vercel, Supabase schema + RLS + auth
  (magic link + 3 OAuth) enforced, documents in Supabase Storage.
- **P2 done:** first paid consulting engagement delivered end-to-end with
  automated booking + commercial documents.
- **Enterprise 1.0 achieved:** first paid engagement · accepted delivery ·
  lessons captured · evidence recorded · no governance bypass.
- **P3 unlocked:** three successful paid engagements with captured lessons.
- MASTER → 1.9.0 when P1 + P2 review triggers pass.
