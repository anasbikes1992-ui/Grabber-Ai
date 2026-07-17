# Grabber AI Studio — Enterprise v3.0 Roadmap

**Status:** Architecture frozen. Focus = **Operating Readiness (OR)**, not version churn.  
**Date:** 2026-07-17  
**Prerequisite:** Product Factory v2.0 complete · Grabber Core v1.8.x frozen  
**Canonical now:** [STRATEGY.md](./STRATEGY.md) · [OPERATING-READINESS.md](./OPERATING-READINESS.md)

---

## Transition

You are no longer designing an **AI coding tool**.

You are designing an **AI-native software company**.

```
Client → AI Consulting → Business Analysis → Commercial Approval
      → Factory → Delivery → Maintenance
```

That is a complete operating model.

### CTO assessment

| Layer | Completeness |
|-------|----------------|
| Product Factory (architecture) | **90–95%** |
| Remaining work | Business workflows + production readiness |
| Grabber Core | **Do not change** unless reliability/cost/security/determinism improves |

---

## Six long-lived programs

Not short sprints — permanent product programs.

### Program A — Business OS (highest priority)

Sales, consulting, and commercial engine.

| Capability |
|------------|
| AI business consultation |
| Discovery interviews |
| Requirement gathering |
| Industry-specific questioning |
| Competitor analysis |
| Business process mapping |
| Pain-point / opportunity ID |
| ROI estimation |
| CTO review |
| Commercial review |
| Proposal & quote generation |
| Scope definition |
| Approval workflow |

**Differentiation starts here.**

### Program B — Factory Excellence

Factory already exists — improve quality, do not redesign.

- More modules & blueprints  
- Regression + regeneration  
- Golden references  
- Faster deterministic builds  
- Higher module reuse  

### Program C — Client Experience

Premium client portal:

- Proposals, scope, comments, documents  
- Milestone approval  
- Build tracking  
- Deliverables, invoices, support  

### Program D — Operations

Run Grabber as a business:

- Leads, pipeline, capacity  
- Active projects, revenue, costs  
- Maintenance, renewals, tickets, profitability  

### Program E — Marketing Intelligence

**Separate product** — do not mix with Product Factory.

```
Trend Discovery → Competitor Monitoring → Keywords
  → Content Planning → Creation → Human Approval
  → Publishing → Analytics
```

### Program F — Jarvis Experience

**Only after A–E maturity.** Presentation layer:

- Premium UI, motion, optional 3D  
- Command palette, voice, executive dashboards  

Not business logic.

---

## Critical addition: Delivery Governance

**Before** Product Factory:

```
Client
  → Discovery
  → Business Analysis
  → Solution Design
  → Commercial Review
  → Risk Review
  → Legal Review
  → Internal Approval
  → Client Approval
  → Deposit Received
  → Factory Build
```

Prevents scope creep; protects the business.

---

## Industry Playbook Library

Playbooks (not one-size discovery):

Hotels · Restaurants · Retail · Logistics · Healthcare · Education ·  
Manufacturing · Construction · Real Estate · Legal · Finance · …

Each playbook includes:

- Typical workflows  
- Required modules  
- Compliance  
- Common integrations  
- Suggested upsells  
- Risk checklist  

Jarvis/Business OS tailors discovery by industry.

---

## Commercial deliverables (every engagement)

Clients buy **artifacts**, not “the code”:

| Deliverable |
|-------------|
| Executive Summary |
| Business Analysis |
| Requirements Specification |
| Functional Scope |
| Non-Functional Requirements |
| Solution Overview |
| Architecture Summary |
| Module Selection |
| Integration Plan |
| Timeline |
| Cost Estimate |
| Risk Register |
| Proposal |
| Statement of Work |
| MSA draft |
| Change Request template |
| Maintenance Plan |
| UAT criteria |
| Deployment Plan |

---

## Success metrics (whole business)

| Area | KPI |
|------|-----|
| Sales | Lead → Proposal conversion |
| Discovery | Discovery completion time |
| Commercial | Proposal acceptance rate |
| Factory | DNA → Deployment time |
| Engineering | Module reuse rate |
| Quality | First-pass validation rate |
| Finance | Gross margin per project |
| Customer Success | Maintenance renewal rate |
| Experience | Client satisfaction |

---

## Milestones (scaffold ≠ proven)

| # | Milestone | Outcome | Scaffold | Production / commercial |
|---|-----------|---------|----------|-------------------------|
| **1** | Business OS | Consultation → DNA workflows | Feature scaffold | **Not proven** — deepen Program A |
| **2** | Client Portal | Collaboration, approvals, documents | Feature scaffold | **Not proven** |
| **3** | Commercial Automation | Proposals, SOW, MSA drafts | Feature scaffold | **Not proven** (counsel later) |
| **4** | Factory Integration | Approved DNA → factory only | Gate + tests | Strong unit coverage |
| **5** | Delivery & Support | Deploy, support, renewals | Feature scaffold | **Not proven** |
| **6** | Marketing Intelligence | Research → publish | Feature scaffold | **Not proven** |
| **7** | Jarvis Experience | Premium thin client | Foundation | Polish after A–E depth |

**Honest maturity:** [ENTERPRISE-MATURITY.md](./ENTERPRISE-MATURITY.md)  
**Next work:** [DOGFOOD-PROTOCOL.md](./DOGFOOD-PROTOCOL.md) — **not** more multi-program feature blitzes.

### Implementation map (feature scaffold exists)

| Milestone | Package / app |
|-----------|----------------|
| Domain | `packages/enterprise` — engagements, commercial, ops, delivery, marketing, portal, KPIs |
| Surfaces | `apps/enterprise` — Business OS, Portal, Ops, Delivery, Marketing, KPIs, Governance |
| Factory gate | `apps/saas-starter/src/factory/governance-gate.ts` + `/api/factory/handoff` |
| CLI | `grabber enterprise seed\|list\|handoff\|from-engagement\|kpis\|campaign` |
| Jarvis shell | `apps/jarvis-os` — `/enterprise` links |
| Playbooks | `knowledge/playbooks/` (hospitality seed + index) |
| Unit tests | enterprise + CLI + governance-gate — **not** commercial proof |

### Agent policy

- **Never:** “complete all milestones” / implement A–F in one pass.  
- **Always:** one program, explicit Definition of Done, Track B only, tests + docs, no Core redesign.

---

## Feature filter (v3.0)

Every new feature must satisfy **at least one**:

1. Higher quality client discovery  
2. Better commercial conversion  
3. Lower delivery cost or time  
4. Higher delivery quality  
5. Higher client satisfaction  
6. Higher module reuse  
7. Higher profitability  

Otherwise it does **not** ship in the next release — and it almost never belongs in Grabber Core.

---

## What stays frozen

- Grabber Core architecture  
- IEP / builders / validation contracts  
- “No second orchestrator” rule  
- Product Factory as the only manufacturing path  

## What grows

- Business OS  
- Playbooks  
- Commercial deliverables  
- Client portal  
- Ops  
- Marketing Intelligence  
- Jarvis as shell over the above  

---

## Repo mapping (implemented)

| Program | Location (Track B) |
|---------|---------------------|
| A Business OS | `apps/enterprise` `/business` + `packages/enterprise` engagements |
| B Factory Excellence | `apps/saas-starter` modules, blueprints, references (unchanged Core) |
| C Client Portal | `apps/enterprise` `/portal` + `packages/enterprise/portal.js` |
| D Operations | `apps/enterprise` `/ops` + `packages/enterprise/ops.js` |
| E Marketing Intelligence | `apps/enterprise` `/marketing` + `packages/enterprise/marketing.js` |
| F Jarvis Experience | `apps/jarvis-os` `/enterprise` shell over programs A–E |
| Delivery Governance | `packages/enterprise` governance stages + factory handoff gate |
| Industry Playbooks | `knowledge/playbooks/` |

---

## Current baseline

- Core frozen + Product Factory v2.0 **mature**  
- Intake → DNA → assembly → integrations → metrics  
- Enterprise domain + multi-surface app + factory gate = **feature scaffold**  
- Golden: SaaS, CRM, Marketplace, Booking  
- **Not** enterprise-ready until dogfood + hardening + commercial validation  

**Now:** **OR-1** internal operation — [DOGFOOD-PROTOCOL.md](./DOGFOOD-PROTOCOL.md) · [OPERATING-READINESS.md](./OPERATING-READINESS.md)  
**Then:** OR-2 repeatability → OR-3 reliability → **only then** CR-1 first customers  
**CI loop:** every finished project → lessons → playbooks/modules/blueprints  

**Run:** `npm run enterprise:dev` (:3002) · `npm run jarvis:dev` (:3001) · `npm run saas:dev` (:3000)  
**Unit regression only:** `npm run test:enterprise` · `npm run test:milestones`