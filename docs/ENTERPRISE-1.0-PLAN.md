# ENTERPRISE 1.0 — Execution Plan

**Status:** Active plan (EDR-008) · **Owner:** Anaz · **Version:** 1.0.0
**Goal:** a stranger becomes a paying customer and receives a deployed,
supported application — end-to-end through the platform — with minimal
manual help.

**Sizing:** S = days · M = 1–2 weeks · L = 2–4 weeks. Sequential unless
marked ∥ (parallelizable). Every milestone ends with a demo of its lifecycle
stages actually running.

---

## M0 — Adopt the model (S) — do first, mostly renames and docs

1. `git init`, commit, tag `v1.8.0` (audit P0 — non-negotiable before anything else).
2. Fix root `npm test` separators `;` → `&&` (audit P1).
3. Vocabulary: replace "Track A/B" with **Foundation Layer / Delivery Layer**
   in MASTER, PLAYBOOK, OPERATING-MODEL (Rule 1: DELIVERY-LIFECYCLE.md is
   the single home of the lifecycle; everything else links).
4. Create `templates/BUSINESS-DNA-TEMPLATE.yaml` (company, workflows,
   pain_points, goals, kpis, budget, priorities, timeline, stakeholders —
   no technology fields).
5. Capability Registry: add Business OS, Execution Orchestrator, Client
   Portal, Evidence Engine, Success Engine as `Planned` with owners from the
   ownership matrix (EDR-008).

**Done when:** repo is versioned, tests fail loudly, docs speak lifecycle language.

---

## M1 — Acquire (M)

Build: public website (marketing pages + case-study placeholders) and
consultation booking (calendar + intake form feeding the Business OS).
Lead model: source, qualification rules, score, status.

**Answers required:** How does someone discover us? What qualifies a lead?
What triggers a consultation?
**Docs due:** `ENVIRONMENTS.md`, `DEPLOYMENT.md` (Tier 1 — the website is
your first production deployment: GitHub → Vercel → Supabase).
**Done when:** a stranger can book a consultation with zero manual help,
and the lead appears in Business OS.

---

## M2 — Discover · Analyze · Recommend (L) — the Jarvis milestone

Build: Jarvis consultation flow (structured discovery interview → resumable
sessions → returning-company memory), **Business DNA generation**, proposal
generation (scope, price, timeline, evidence citations), Business OS core
(companies, engagements, proposals in Supabase with RLS).

**Jarvis rules (constitutional):** cites evidence, explains recommendations,
refuses to guess (missing required info → asks or hands off to human),
resumes interrupted consultations.
**Answers required:** minimum discovery information? when does Jarvis hand
off to a human?
**Docs due:** `SECURITY.md` (Tier 1 — JWT, RLS, storage, secrets, API keys
land here), `BUSINESS-OS.md` started.
**Done when:** a booked consultation produces a Business DNA and a
client-ready proposal without you writing either.

---

## M3 — Approve (M) ∥ with M2 tail

Build: proposal approval workflow (versioned revisions, internal approval,
client accept/reject with reasons tracked), contract e-sign, payment/deposit
(Stripe), rejection analytics (acceptance rate by industry).

**Answers required:** who approves internally? where does payment happen?
what happens on revision or rejection?
**Done when:** an accepted proposal automatically creates a paid, contracted
engagement in Business OS.

---

## M4 — Plan · Build · Verify (M) — mostly exists; close the gaps

Build: **Execution Orchestrator** — the Business DNA → Project DNA
transform (the one genuinely new Foundation-Layer component; needs an EDR
for its transform rules). Wire to the existing factory. Add the four factory
resilience answers: fail safely (resume after interruption), human
intervention point, **single-module regeneration**, reproducible builds
(fingerprint → identical rebuild six months later).

**Docs due:** `FACTORY.md` (Tier 2).
**Done when:** an approved engagement's Business DNA becomes a Project DNA,
`grabber build` produces the blueprint, and a human review gate approves it.

---

## M5 — Deliver · Support (L)

Build: Client Portal (progress view, document upload, milestone approvals,
chat, meeting scheduling, invoice download), production deployment path for
client apps (envs: local → preview → production; rollback; incident
tracking), support workflow (tickets tied to engagements).

**Docs due:** `DATA-FLOW.md` (Tier 2), `OPERATIONS-RUNBOOK.md` started.
**Done when:** a client can follow their project, approve milestones, and
receive a production URL without email ping-pong.

---

## M6 — Learn · Improve (M)

Build: **Evidence Engine** (outcomes per engagement: what was recommended,
built, reused, ignored; ROI data) and **Success Engine** (post-deploy:
ROI review → renewal → referral → case study → knowledge). Knowledge
promotion becomes routine: reused twice → pattern/module.

**Answers required:** which recommendations convert best? which industries
close fastest? which solutions always succeed?
**Done when:** closing an engagement automatically enriches knowledge and
produces a case-study draft — and Jarvis's next consultation cites it.

---

## The Enterprise 1.0 gate (all must be ✅ end-to-end, one real run)

Website live → booking → Jarvis discovery → Business DNA → proposal →
client approval → payment → Business OS engagement → Orchestrator →
Project DNA → factory plan → factory build → human review → Client Portal →
production deployment → support workflow → evidence capture → knowledge
update.

Run it once with a friendly pilot customer before calling it 1.0.

---

## Deliberately deferred (do NOT build until the gate passes)

AI employee personas (CEO/CTO/CFO) · multi-LLM routing strategies ·
autonomous coding without human review · 3D avatar / rich voice ·
multi-cloud abstractions · microservice decomposition.

## Docs schedule (from EDR-008 tiers)

- Tier 1 (before first client): DELIVERY-LIFECYCLE ✅ · SECURITY (M2) ·
  DEPLOYMENT (M1) · ENVIRONMENTS (M1)
- Tier 2 (while serving): BUSINESS-OS (M2→M5) · FACTORY (M4) · DATA-FLOW (M5)
- Tier 3 (scaling): REPOSITORY · ONBOARDING · OPERATIONS-RUNBOOK (M5→post-1.0)

## Standing rules

Foundation Layer stays frozen — M4's Orchestrator is the only new Foundation
component and requires its own EDR. Measure the Wall KPI plus three business
numbers from M1 onward: lead → consultation rate, proposal acceptance rate,
DNA → deployment time.
