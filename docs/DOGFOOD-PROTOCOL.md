# Dogfood Protocol — OR-1 Internal Operation

**Purpose:** Prove (or break) the full business lifecycle before OR-2/OR-3 and any CR.  
**Phase:** Operating Readiness stage **OR-1** ([OPERATING-READINESS.md](./OPERATING-READINESS.md)).  
**Constraint:** Track B only. No Grabber Core changes. Product Factory remains the only manufacturing path.  
**Rule:** Nothing skips steps. Do not bypass Business OS / Jarvis for “speed.”

---

## Lifecycle (must complete for each run)

```
Lead
  → Discovery
  → Business Analysis
  → Solution Design
  → Commercial (proposal / quote / SOW / MSA draft)
  → Risk + Legal review
  → Internal approval
  → Client approval
  → Deposit received
  → Project DNA approved
  → Factory handoff (governance gate)
  → Product Factory build
  → Deploy (or dry-run plan)
  → Client portal visibility
  → Support ticket
  → Maintenance / renewal note
```

---

## Scenario catalog (start here)

| ID | Vertical | Suggested blueprint | Playbook |
|----|----------|---------------------|----------|
| DF-01 | Hotel booking | booking | hospitality |
| DF-02 | Restaurant | booking / saas | restaurants |
| DF-03 | E-commerce | marketplace | retail |
| DF-04 | CRM | crm | saas |
| DF-05 | Logistics | inventory | logistics |
| DF-06 | Medical clinic | saas | healthcare |
| DF-07 | School | saas | education |
| DF-08 | Multi-vendor marketplace | marketplace | retail |
| DF-09 | Construction ops | crm | construction |
| DF-10 | Professional services | saas | legal / finance |

Run **at least DF-01–DF-04** before calling Program A “operationally deep.”

---

## How to run (tools)

```bash
# 1) Seed or create engagement (Business OS)
grabber enterprise seed "Scenario Name" hospitality

# 2) Or use apps/enterprise UI :3002 — Business OS → full workflow

# 3) Handoff (must fail if deposit missing)
grabber enterprise handoff <engagementId>

# 4) Create factory product from approved DNA only
grabber from-engagement <engagementId>
# or: grabber enterprise from-engagement <engagementId>

# 5) Build / deploy via Product Factory
grabber build <productId>
grabber deploy <productId>

# 6) Portal / ops / tickets via apps/enterprise
# 7) KPIs
grabber enterprise kpis
```

Store run artifacts under `.grabber/dogfood/<scenario-id>/` (notes + timings). Optional; manual notes OK for Phase 1.

---

## Scorecard (fill per scenario)

| Field | Value |
|-------|-------|
| Scenario ID | |
| Started / finished | |
| Wall time (lead → DNA) | |
| Wall time (DNA → build) | |
| Manual interventions (count + list) | |
| Missing documents | |
| Missing modules | |
| Governance blocks hit? | |
| Factory gate correct? | |
| Portal usable without email? | |
| Support ticket path OK? | |
| Client-ready quality (1–5) | |
| Blockers for production | |

### Intervention severity

- **P0** — cannot complete lifecycle  
- **P1** — wrong commercial/governance outcome  
- **P2** — manual workaround required  
- **P3** — polish / copy / UX  

Only P0/P1 from dogfood justify immediate engineering work.

---

## Exit criteria for Phase 1

- [ ] ≥4 verticals complete end-to-end without Core changes  
- [ ] Governance blocks incomplete engagements every time  
- [ ] Factory accepts **only** eligible DNA  
- [ ] Scorecards filed for each run  
- [ ] Top P0/P1 backlog ranked by business KPI impact  

**Then** decide: deepen Program A, harden production (Phase 2), or expand playbooks — not “build everything.”

---

## Agent prompt for dogfood fixes

```
From dogfood scenario <ID>, fix only these P0/P1 issues: <list>.
Track B only. No Core/runtime redesign. Add tests that would have caught
each issue. Update DOGFOOD scorecard notes in the PR description.
Do not implement unrelated programs.
```
