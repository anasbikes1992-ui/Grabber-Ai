# Grabber AI Studio — Journey

**Status:** Living historical record · append-only

---

# Milestone 1 — Foundation (v1.0)

## Goal
Define the company as a Software Manufacturing Platform, not an AI agency.

## Decisions
Positioning ("we sell certainty"), realistic promises (no blanket 24h),
three revenue streams, five rules, five-layer architecture, 14-stage lifecycle,
three-layer agent separation, confidence gates.

## EDRs
Predates the registry (formalized retroactively by the Constitution).

## Deliverables
MASTER.md, docs 00–03, four canonical templates, standards index + security
exemplar, repo skeleton.

## Lessons Learned
Positioning decisions early prevented documentation sprawl later.

## Challenges
Resisting the urge to specify agents before standards existed.

## Future Work
Standards. (Done in Milestone 2.)

---

# Milestone 2 — Standards & Systems (v1.1)

## Goal
Write the constitution-grade rule set before any prompt or agent.

## Decisions
Build order revised to Foundation → Standards → Intelligence → Execution →
Products; EDRs over plain ADRs; five new systems (Capability Registry,
Pattern Library, Constraint Engine, Project DNA, versioning-everything).

## Deliverables
19 standards with rule codes and rubrics; EDR template; Project DNA template;
constraint block; Capability Registry; Pattern Library scaffolding.

## Lessons Learned
Making every rule testable (MUST + rubric) is what later made the Validation
Runtime implementable without interpretation.

## Challenges
Keeping one home per rule (naming rules folded into Coding/Database/API).

## Future Work
Runtime architecture. (Done in Milestone 3.)

---

# Milestone 3 — Runtime Architecture (v1.2)

## Goal
Bridge documentation to executable software; make the Execution Engine the
center (displacing Prompt OS).

## Decisions
Constitution ratified; four bridge documents (04–07); runtime/ as first-class;
Claude/Antigravity governance split; stop-writing-documents rule.

## Deliverables
ENGINEERING-CONSTITUTION.md, docs 04–07, runtime/ skeleton, updated registry.

## Lessons Learned
Defining acceptance criteria (docs/04 §9) inside the architecture made
"done" objective before a line of code existed.

## Challenges
Folding Event Bus/Agent Runtime/Governance into one doc to avoid doc sprawl.

## Future Work
Implementation. (Done in Milestone 4.)

---

# Milestone 4 — Runtime Sprint 1 (v1.3)

## Goal
ARCHITECTURE FREEZE; ship the six runtime services as tested code.

## Decisions
EDR-001 (freeze, roles, sprint order, Policy Engine + System Health
sanctioned); EDR-002 (dependency-free ESM JS reference implementation).

## Deliverables
Event Bus, Artifact Registry, State Machine, Context Engine, Validation
Runtime, Execution Engine, Policy Engine, Telemetry, System Health;
11 acceptance tests passing.

## Lessons Learned
Layer separation enforced by type (registry rejecting cross-layer writes)
caught design ambiguity that prose never would.

## Challenges
File-sync quirks during build (worked around by writing via shell);
`node --test` directory vs glob semantics.

## Future Work
Validate with a real project. (Done in Milestone 5.)

---

# Milestone 5 — Pilot Project (v1.4)

## Goal
Prove the platform-wide success metric: a brand-new Project DNA file travels
the runtime end-to-end.

## Decisions
EDR-003: pilot before Sprint 2; revised sprint roadmap (Artifact Query added);
four-domain repository split target for v2.0.

## EDRs
EDR-003 (including finding F-1).

## Deliverables
projects/pilot-task-manager (DNA), runtime/pilot/pilot.js, pilot acceptance
test (12/12 total), PLAYBOOK.md, this document.

## Result
**YES** — intake → closed, 15 gate-driven transitions, 38 artifacts
(18 approved + 19 validation reports), 1 automatic loopback (coverage
82% → 96%), 0 manual interventions, provenance 100%, no policy blocks.

## Lessons Learned
- The pilot exposed exactly one spec-conformance flaw (F-1: SM-06 bypass on
  gatePassed→closed) — the freeze rule worked as designed: implementation
  exposed it, an EDR recorded it, the fix was surgical.
- Deterministic stand-in agents are enough to validate the platform; model
  behavior is a separate risk deferred to Sprint 3.

## Challenges
Ordering of learning events relative to the improvement gate (resolved:
Learning Engine emits before the gate; formalized in Sprint 3).

## Future Work
Sprint 2: Platform Infrastructure — green-lit by this milestone. (Done in Milestone 6.)

---

# Milestone 6 — Platform Infrastructure (v1.5)

## Goal
Build the persistent, queryable, observable foundation that allows the
validated runtime to scale from a successful pilot into a reusable platform
(EDR-004; CTO Platform Infrastructure framing).

## Decisions
EDR-004: Sprint 2 = Foundation APIs + storage contracts (not hard-wired
vendors) + Dependency Graph §9.6; SDK / Plugin / Agent runtimes deferred to
v1.6–v1.7; resist mass skills until those land.

## EDRs
EDR-004.

## Deliverables
- `runtime/src/services/` — DNA, Rule, Decision, Capability, Pattern,
  Knowledge, Artifact Query, Dependency Graph (+ platform search facade)
- `runtime/src/storage/` — Memory Document/Graph/Vector providers + SCHEMA.md
  (PostgreSQL / Redis / vector roadmap)
- `runtime/test/sprint2.test.js` — §9.6 impact analysis and service contracts
- 23/23 tests green

## Result
Foundation APIs are executable. DNA change → impact → stale artifacts works
end-to-end. Search answers dependents, rule-source EDRs, capability usage,
and semantic ranking without filesystem grepping.

## Lessons Learned
- Treating Sprint 2 as **infrastructure** (contracts + query surface) rather
  than “more markdown services” is what makes a pilot become a platform.
- Vector provider as an interface from day one prevents later rewrites.

## Challenges
Keeping in-memory defaults production-shaped without requiring ops for tests.

## Future Work
v1.6 Platform Extension Framework. (Done in Milestone 7.)

---

# Milestone 7 — Platform Extension Framework (v1.6)

## Goal
Developer experience + stable extension points so the platform grows without
modifying Grabber AI Studio Core (EDR-005).

## Decisions
- Rename framing: **Grabber AI Studio Core**; Jarvis is an app on Core.
- v1.6 = Platform Extension Framework (not only “SDK + plugins”).
- Unified extension lifecycle for plugin/connector/skill/workflow/template/
  knowledge-pack/agent/policy/validator.
- Connectors stay thin; 21 first-party skill manifests (not 100 deep skills).
- Docs lag implementation.

## EDRs
EDR-005.

## Deliverables
- `packages/{common,sdk,plugin-sdk,connector-sdk,skill-sdk,workflow-sdk,template-sdk,agent-sdk,cli}`
- `runtime/src/extensions` — ExtensionRuntime lifecycle
- `skills/` — first-party shortlist + catalog.json
- Tests: runtime 30, sdk 3, cli 6

## Result
Extensions install through one pipeline; SDK is the Foundation API contract;
`grabber doctor|validate|skill list|runtime status` works.

## Lessons Learned
Manifest-first skills unblocked DX without pretending domain depth is done.

## Future Work
v1.7 Intelligent Execution Platform. (Done in Milestone 8.)

---

# Milestone 8 — Intelligent Execution Platform (v1.7)

## Goal
Build the execution environment first; agents are replaceable jobs on that
environment (EDR-006; CTO: not “Agent Runtime” alone).

## Decisions
- Platform before agents (Docker before containers).
- Pipeline: Scheduler → Priority Queue → Dependency Resolver → Executor →
  Metrics/Cost/Recorder.
- Memory as a Service (5 layers).
- Runtime Recorder: every execution replayable.
- Agent lifecycle: initialize → prepare → buildContext → execute → validate →
  publish → learn → shutdown.
- Track engineering KPIs, not file counts.

## EDRs
EDR-006.

## Deliverables
`runtime/src/iep/*`, agent-sdk lifecycle update, `runtime/test/iep.test.js`
(10 tests). Total runtime suite: 40 passing.

## Result
Jobs with deps/priority/retry run; agents schedule as `agent.run`; cost and
replay attach to every execution; KPIs queryable via `iep.kpis()`.

## Future Work
v1.8 Product Factory. (Done in Milestone 9.)

---

# Milestone 9 — Product Factory (v1.8)

## Goal
Shift from building the platform to **building products with** the platform
(EDR-007). Platform core complete; dual-track operating model.

## Decisions
- Rename Development Factory → **Product Factory**
- Artifact Builders are deterministic (not agents); IEP schedules them
- Only three templates: SaaS Starter, CRM, Marketplace
- Reference projects = regeneration regression suite
- Wall KPI: DNA → deployable time (+ intervention, cost, equivalence)

## EDRs
EDR-007.

## Deliverables
- `runtime/src/factory/` — builders + ProductFactory
- `templates/products/{saas-starter,crm,marketplace}`
- `reference-projects/*` regression DNAs
- CLI product commands; deepened GitHub/Supabase/Stripe/Postgres/Docker skills
- Priority connector manifests
- Tests: product-factory + CLI plan/build/validate

## Result
All three reference projects regenerate twice with equivalent fingerprints,
validation pass, zero intervention, replayable, within budget.

## Future Work
Track B domain expansion; Track A only for genuine gaps; portals at v1.9.
