# Execution Roadmap — Build Order

**Architecture is frozen. Do not redesign.**  
**Constitution:** [CONSTITUTION.md](./CONSTITUTION.md) (philosophy only)  
**Current milestone:** [EDR-008](../decisions/EDR-008-execution-quality-milestone.md) — P1 production foundation → P2 consulting experience → P3 factory automation (gated on 3 paid engagements).  
**Only KPI that matters today:**

> How many businesses completed:  
> **first conversation → approved proposal → delivered outcome → captured lessons?**

Measured as a funnel — track **conversion rate and elapsed time between every stage**:

```
Lead → Discovery → Proposal → Approval → Deposit
  → Delivery → Success → Referral → Knowledge Added
```

Everything else exists to raise that number, shorten the path, or improve quality.

---

## Stage 0 — Freeze (DONE)

Constitution · Product Model · Core · Factory · Business OS · Enterprise model · Operating philosophy.

No new strategy docs. No renames. No new intelligence layers for planning’s sake.

---

## Build order (what to ship)

| Priority | Build | Goal |
| ---: | --- | --- |
| **1** | Landing website + booking | Acquire leads |
| **2** | Jarvis consulting workflow | Qualify & understand businesses |
| **3** | Production foundation (Supabase, Auth, Storage) | Real-client readiness **before** real data exists |
| **4** | Business OS | Manage engagements |
| **5** | Customer portal | Trust & transparency |
| **6** | Factory planning (DNA → architecture → task graph) | Governed transition to delivery |
| **7** | Factory build (builders → verification → human approval) | Execute projects efficiently |
| **8** | Operations (support, renewals, referrals) | Close the lifecycle |
| **9** | Knowledge engine | Continuously improve recommendations |
| **10** | Marketing automation | Scale lead gen (**after** consulting works) |

**Evidence capture is not a stage — it starts at the first consultation** (see cross-cutting rules below).

---

## Cross-cutting rules (apply from Stage 1 onward)

### Evidence — incremental from day one

Don't wait for ROI data. From the very first lead, capture:
accepted/rejected · objections · reason · industry · company size · requested features → Knowledge.
Earned-outcome integrity rules (Constitution) still apply — capture facts, never invent results.

### Module Library — operational reuse

After **every** completed project, extract reusable implementation assets
(Invoice · Inventory · CRM · Booking · Approval · Dashboard modules, …).
Not architecture — working, reusable delivery assets. Reuse rate is a tracked metric.

### Delivery Metrics dashboard

Track continuously:
Lead→Discovery, Discovery→Proposal, Proposal→Paid conversions ·
avg discovery duration · avg proposal generation time · avg delivery time ·
module reuse % · evidence strength per recommendation · customer satisfaction · revenue per industry.

### Human Review Gate — mandatory before every deployment

Proposal Approved → Factory Planning → AI Build → Verification → **Human Approval** → Deploy

No artifact reaches a client without explicit human approval. No exceptions.

---

## Stage map (detail)

### Stage 1 — Platform usable (NOW)

```
Landing Website → Book Consultation → Jarvis Discovery
  → Business Analysis → Recommendations → Proposal
  → Approve → Factory → Dashboard
```

**Nothing else until this path works for a human visitor.**

**Exit criteria:** website deployed · booking works · lead stored.

### Stage 2 — Jarvis Consulting

LLM · conversation memory · business context · follow-ups · confidence · verification · executive package.  
**Not** code generation.

**Exit criteria:** LLM follow-up questions work · executive report generated · deterministic fallback passes.

### Stage 3 — Production Foundation

**Moved ahead of Business OS deliberately:** once real client information enters the
system, auth, storage, and persistence must never be migrated afterward.

Supabase (Postgres + RLS) · Auth (magic link + OAuth, role enforcement) ·
Supabase Storage for all generated documents · secrets · backups · monitoring · CI/CD.

File-backed store is OK for prototype demos; **not** for real client onboarding.

**Exit criteria:** authentication enforced · Supabase persistence live · secure document storage (never filesystem).

### Stage 4 — Business OS (internal CRM)

Leads → Companies → Meetings → Discovery → Proposals → Approvals → Invoices → Projects → Support → Renewals

**Exit criteria:** one real client managed end-to-end.

### Stage 5 — Customer Portal

Status · Deliverables · Invoices · Contracts · Timeline · Meetings · Support · Documents · Approvals · Deployments

**Exit criteria:** a client can self-serve status, documents, and approvals for a live engagement.

### Stage 6 — Factory Planning

Planning happens **before** any code generation:

```
Approved Proposal → Business DNA → Technical DNA → Architecture → Task Graph
```

**Exit criteria:** factory receives approved DNA · project plan generated · developer approves plan.

### Stage 7 — Factory Build

```
Task Graph → Builders → Verification (compile · typecheck · lint · tests ·
security · performance) → Human Approval → Deployment
```

**Exit criteria:** verification passes on all stages · human approval recorded · deploy succeeds.

### Stage 8 — Operations (post-deployment)

The client relationship continues after deploy:

```
Deploy → Monitoring → Support → Enhancements → Renewal → Referral → Case Study → Knowledge Update
```

Each delivery also closes the commercial loop:

```
Success Review → ROI Review → Case Study → Referral → Knowledge Capture → Module Promotion
```

**Exit criteria:** monitoring live · support channel active · first renewal/referral/case-study captured into Knowledge.

### Stage 9 — Knowledge Engine

After delivery: playbooks · modules · blueprints · benchmarks · rules · interview questions

**Exit criteria:** every completed project produces at least one playbook update and one reusable module.

### Stage 10 — Decision Intelligence depth

Full explainability on every recommendation

**Exit criteria:** every recommendation traces to evidence with a strength score.

### Stage 11 — Marketing Engine

Only after consulting works

**Exit criteria:** consulting loop closed ≥3 times before any marketing automation ships.

### Stage 12 — Developer Factory (internal only)

Never expose to clients

### Stage 13 — Dogfood

Hotel · Textile · Construction · Healthcare · Marketplace — full workflows

**Exit criteria:** all five dogfood workflows complete discovery → proposal → plan without manual patching.

### Stage 14 — Real clients

Full lifecycle through the platform. **Hard gate:** Stage 3 exit criteria must be met first.

### Stage 15 — Scale (evidence-driven, not aspirational)

```
Scale = 20–30 completed engagements
  → reusable playbooks → reusable modules → repeatable delivery
  → product candidates → potential SaaS
```

Productization questions answered by evidence only.

---

## Current focus

```
✓ Website   ✓ Booking   → LLM Consulting (in progress)
  → Supabase → Auth → Storage → Executive Reports → First Client
```

**Stage 2 — Jarvis LLM consulting (in progress / ready to run).**
Then Stage 3 (Production Foundation) **before** onboarding any real customer.

### First production milestone — Enterprise 1.0, concretely

All of the following happen **once**, end-to-end, and the business is proven:

- [ ] Website live on Vercel
- [ ] Supabase connected
- [ ] Authentication working
- [ ] Booking working
- [ ] WhatsApp connected
- [ ] Calendar connected
- [ ] Discovery interview completed
- [ ] Executive proposal generated
- [ ] Client approves proposal
- [ ] Deposit recorded
- [ ] Project appears in Business OS
- [ ] Factory creates Project DNA
- [ ] Developer dashboard populated
- [ ] Delivery completed
- [ ] Client signs off
- [ ] Knowledge captured
- [ ] Evidence updated

| Piece | Location |
|-------|----------|
| LLM single entry | `packages/enterprise/src/llm.js` |
| Verifier | `packages/enterprise/src/verifier.js` |
| Discovery / gap / review LLM | `consulting-llm.js` + async consulting.js |
| Executive HTML | `executive-package.js` · `GET /api/consulting?id=&format=html` |
| Fallback | No key or `GRABBER_LLM=0` → deterministic (tests green) |

```bash
# enterprise process needs the key:
set ANTHROPIC_API_KEY=sk-ant-...
npm run enterprise:dev
npm run website:dev
# open :3003/consult
```

### Infrastructure note

Production foundation is now **Stage 3** — auth, storage, and persistence land before Business OS and before any real proposals/contracts are stored. Not a reason to delay Stage 1 UX; a hard gate before production customer data.

---

## Roadmap freeze

This roadmap is frozen as the execution plan. Further changes come **only from real
client engagements** — never from architectural redesign (Constitution: accumulate
evidence, don't invent layers).

Supporting maps: [SYSTEMS.md](./SYSTEMS.md) (ownership + production services checklist) ·
[QUALITY-GATES.md](./QUALITY-GATES.md) · [EDR-009](../decisions/EDR-009-knowledge-engine.md) ·
[EDR-010](../decisions/EDR-010-execution-orchestrator.md).

Implementation priority from here:
1. **Production Foundation** — Vercel, Supabase, auth, storage, secrets, monitoring
2. **Integrations** — WhatsApp Business API, calendar, email notifications, PDF generation, payments
3. **Commercial validation** — discovery interviews, executive reports, first paid blueprint
4. **Execution automation** — Execution Orchestrator + Factory, only after consulting is validated
5. **Evidence & knowledge** — completed projects populate the Knowledge Engine
