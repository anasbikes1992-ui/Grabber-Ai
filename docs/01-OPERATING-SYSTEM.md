# 01 — THE OPERATING SYSTEM

**Parent:** [MASTER.md](../MASTER.md)
**Status:** Complete
**Version:** 1.0.0

How Grabber AI Studio functions as an engineering platform: the delivery
lifecycle, the three-layer agent separation, confidence gates, metrics,
the Decision Registry, and technology decision rules.

---

## 1. The Delivery Lifecycle (14 Stages)

Coding happens at stage 8 — after seven stages of thinking.

```
 1. Business Discovery        what problem, for whom, why now
 2. Business Analysis         market, constraints, risks, viability
 3. Requirements Engineering  PRD, user stories, acceptance criteria
 4. Solution Architecture     system design, integrations, trade-offs
 5. Technical Planning        tasks, milestones, dependencies, estimates
 6. Design System             UI standards, components, accessibility
 7. Data Architecture         schema, migrations, RLS, retention
 8. Development               implementation against approved specs
 9. Verification              tests, linting, coverage, acceptance
10. Security                  automated security suite (see §8)
11. Performance               load, latency, bundle, query budgets
12. Deployment                CI/CD, domains, SSL, rollback plan
13. Monitoring                logging, alerting, uptime, error tracking
14. Continuous Improvement    lessons learned → Knowledge Engine
```

Each stage has a defined **input contract**, **output contract**, and
**confidence gate** (§3). Stage documents follow
[templates/PHASE-TEMPLATE.md](../templates/PHASE-TEMPLATE.md).

---

## 2. Three-Layer Agent Separation

One AI doing everything causes cascading errors. Responsibilities are split:

### Thinking Layer (decides, never codes)

Business Analyst · Product Manager · System Architect · UX Designer

Outputs: PRDs, architecture documents, decision records, specifications.

### Building Layer (implements, never decides features)

Backend · Frontend · Database · Mobile · Infrastructure

Inputs: approved specifications only. A builder receiving an ambiguous spec
**escalates** to the Thinking Layer — it never fills the gap itself (Rule 4).

### Verification Layer (verifies, never builds)

QA · Security · Performance · Accessibility · Documentation

Workers never approve their own output. Validators decide; workers write.

### Flow

```
Knowledge Base → Planning → Orchestrator → Workers → Validators → Approvers → Deployment
```

Hierarchy is one-directional (Jarvis → PM → Architect → Planner → Lead →
Workers → Validators → QA → Deployment). No circular agent conversations.

---

## 3. Confidence Gates

Every stage produces a measurable score before progressing. Below threshold →
loop back for correction; never continue on a failing gate.

| Stage | Gate | Default threshold |
|-------|------|-------------------|
| Business Analysis | completeness + stakeholder sign-off | 90% |
| Architecture | standards compliance + risk review | 90% |
| Database | schema validation + RLS coverage | 95% |
| Backend | tests + lint + spec conformance | 90% |
| Frontend | tests + accessibility + spec conformance | 90% |
| Testing | coverage + acceptance criteria pass rate | 95% |
| Security | automated suite, zero criticals | 98% |
| Deployment | checklist complete, rollback verified | 100% |

Scores are computed by validator agents against explicit rubrics defined in
`/standards`, not self-reported by workers. Thresholds are configuration, not
code — tuned per project class via the Learning Engine.

---

## 4. The Decision Registry

Every major decision is recorded in `/decisions` using
[DECISION-RECORD-TEMPLATE.md](../templates/DECISION-RECORD-TEMPLATE.md):

why it was made, alternatives considered, trade-offs, assumptions, risks,
owner, date, status, and **affected artifacts**.

When requirements change, Jarvis queries the registry to identify exactly which
decisions (and therefore which artifacts) are affected — instead of re-analyzing
the whole project. Decision records are indexed in the Knowledge Graph
([03 §3](03-KNOWLEDGE-ENGINE.md)).

---

## 5. Standards Before Agents

Agents follow standards; standards don't follow agents. The canonical set
(defined in `/standards`, Phase 3):

Coding · Architecture · Database · API · Security · UI · Accessibility ·
Testing · Documentation · Naming · Git · Performance · Deployment

Every agent spec lists the standards it is bound by. Changing a standard
updates every agent's behavior at once — that's the point.

---

## 6. Metrics (Everything Measurable)

Every project exposes three metric families:

**Business:** time to proposal · time to architecture · time to MVP ·
budget variance · change requests.

**Engineering:** test coverage · build success rate · deployment frequency ·
defect rate · security findings.

**AI:** prompt success rate · agent correction rate · manual intervention
rate · token cost per project · average build time.

Metrics feed the Learning Engine ([02 §8](02-JARVIS-CORE.md)). Without them,
continuous improvement is guesswork.

---

## 7. Technology Decision Rules

Next.js + Supabase is a strong default — not a mandate. The Orchestrator
chooses stack from requirements via decision rules:

| Project profile | Default stack |
|-----------------|---------------|
| CRUD dashboard | Next.js + Supabase |
| Enterprise API | NestJS + PostgreSQL |
| Content-heavy site | Astro |
| Real-time collaboration | Next.js + Supabase Realtime |
| AI inference service | FastAPI |
| Mobile-first product | Flutter |

Rules live in `knowledge/architecture/decision-rules.md` (single source of
truth). Overriding a rule requires a Decision Record.

**Model/tool routing** follows the same principle (detail in
[02 §3](02-JARVIS-CORE.md)): orchestration and validation by Jarvis;
implementation-heavy coding by the best available coding model; architecture
review and long-context reasoning by long-context models; structured outputs
and documentation by the most reliable structured-output model; local models
for indexing and low-cost tasks. Roles, not brands — bindings are configuration.

---

## 8. Security Engine (a Rule, Not a Phase)

Every pipeline automatically performs:

OWASP Top 10 · secret scanning · dependency scanning · RLS validation ·
SQL injection checks · XSS · CSRF · SSRF · authentication review ·
authorization review · rate limiting · secure headers · audit logging ·
configuration review.

No manual security pass. A pipeline without the security suite cannot reach
the Deployment gate. Findings are recorded, classified, and blocked on
severity ≥ high.

---

## 9. Qualifying Projects (Intake Rules)

A project qualifies for the 24–48h first-version promise when **all** hold:

- Stack maps to a decision rule in §7 (no novel infrastructure)
- ≤ 2 third-party integrations, all with existing playbooks
- No regulated-data requirements beyond standard patterns (else: extended discovery)
- An industry template or pattern exists in the Knowledge Engine
- Client sign-off possible within the discovery window

Anything else routes to the weekly-incremental engagement model. Sales cannot
override intake rules without a Decision Record signed by the owner.
