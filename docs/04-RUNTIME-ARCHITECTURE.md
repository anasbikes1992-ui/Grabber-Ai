# 04 — RUNTIME ARCHITECTURE

**Parent:** [MASTER.md](../MASTER.md) · **Constitution:** [ENGINEERING-CONSTITUTION.md](../constitution/ENGINEERING-CONSTITUTION.md)
**Status:** Approved · **Version:** 1.0.0

The bridge from documentation to executable software. The **Execution Engine**
— not the Prompt OS — is the center of the platform. Prompts become one input
the engine consumes; they no longer organize the system.

---

## 1. The Formalized Chain

```
Engineering Constitution
        ↓
Engineering Standards
        ↓
Knowledge Engine
        ↓
Decision Registry (EDRs)
        ↓
Project DNA
        ↓
Context Engine        ← doc 05
        ↓
Execution Engine      ← this document
        ↓
Agent Runtime         ← §5
        ↓
Validation Runtime    ← §6
        ↓
Development Factory
        ↓
Deployment
```

Everything above the Context Engine is **declarative** (documents, registries).
Everything from the Context Engine down is **runtime** (software). The four
runtime documents (04–07) specify that software deterministically enough that
implementation is an exercise, not a design activity.

## 2. Runtime Components → Folder Map

```
runtime/
├── context/         Context Engine (doc 05)
├── artifacts/       Artifact Registry (doc 06)
├── events/          Event Bus (§4)
├── state-machine/   Project State Machine (doc 07)
├── validators/      Validation Runtime (§6)
├── orchestration/   Execution Engine core (§3)
├── routing/         Brain Router runtime (02-JARVIS-CORE §3)
├── execution/       task execution adapters (models, tools, sandboxes)
└── telemetry/       OB-09/OB-10 pipeline observability
```

## 3. Execution Engine (the Center)

The Execution Engine turns a project's state into work:

```
State Machine says what stage the project is in
  → Execution Engine derives the next tasks (from the stage's workflow)
  → Dependency Graph orders them
  → Context Engine builds each task's context bundle
  → Router selects the engine (model/tool) for the task class
  → Agent Runtime executes the task
  → Artifact Registry receives the output
  → Validation Runtime scores it
  → Event Bus announces the result
  → State Machine advances, loops back, or escalates
```

Determinism requirements:

- RT-01 The engine MUST be replayable: given the same project state, DNA,
  standards versions, and artifact set, it derives the same task list.
- RT-02 The engine holds **no business intelligence** — stage logic lives in
  workflow definitions (`/pipelines`), rules live in standards. The engine
  only sequences, dispatches, and records.
- RT-03 Every dispatch is recorded with full provenance (Article V, OB-10).

## 4. Event Bus

All runtime coordination is event-driven; components never call each other's
internals (Article II).

**Envelope (every event):**

```yaml
event:
  id: evt_<ulid>
  type: ""            # from the catalogue below
  project: ""
  stage: ""           # lifecycle stage (01-OS §1)
  subject: ""         # artifact id, task id, or gate id
  actor: ""           # agent/validator/human/system
  payload: {}
  causation_id: ""    # event that caused this one
  correlation_id: ""  # traces one workflow end-to-end (OB-01)
  occurred_at: ""     # ISO-8601 UTC
```

**Event catalogue (v1):**

| Family | Events |
|--------|--------|
| Project | `project.created`, `project.dna_changed`, `project.closed` |
| Task | `task.created`, `task.dispatched`, `task.completed`, `task.failed`, `task.escalated` |
| Artifact | `artifact.produced`, `artifact.validated`, `artifact.approved`, `artifact.superseded` |
| Gate | `gate.passed`, `gate.failed`, `gate.exception_granted` |
| State | `state.transitioned`, `state.loopback`, `state.blocked` |
| Governance | `governance.conflict_detected`, `governance.amendment_proposed` |
| Learning | `learning.report_ready`, `knowledge.entry_merged` |

Rules: delivery is at-least-once, handlers are idempotent (EH-09); events are
append-only and immutable; new event types require a minor version bump of
this catalogue; the event log is the audit trail (Article IX).

## 5. Agent Runtime

Agents become **small**. All intelligence that used to live in prompts moves
into the platform; an agent is a stateless function:

```
(context bundle) → output artifact + events
```

- AG-01 Agents receive everything through the context bundle (doc 05):
  Project DNA → Knowledge → Standards → Artifacts → Context → produce output.
  An agent MUST NOT fetch anything outside its bundle.
- AG-02 Agents are stateless between tasks; memory lives centrally
  (02-JARVIS-CORE §4). No intelligence duplicated across agents.
- AG-03 Agent output MUST be a valid artifact envelope (doc 06) — free-form
  output is rejected before validation even begins (PR-07).
- AG-04 Agent lifecycle per task: `dispatched → executing → produced |
  escalated | failed`; two failures on the same task escalate (Article VI).
- AG-05 Agent specs (AGENT-SPEC-TEMPLATE) bind each agent to its standards;
  the runtime enforces the layer separation of Article VI mechanically —
  a Thinking agent's output containing code artifacts is rejected by type.

## 6. Validation Runtime

Executes the constitutional validation sequence on every artifact:

```
Syntax → Standards → Architecture → Security → Performance
       → Accessibility → Documentation → Completion
```

- VR-01 Validators run rubrics published in `/standards`; scores map to the
  gate table (01-OS §3).
- VR-02 A validation produces: score, pass/fail per rule id, and a structured
  correction list — never prose-only feedback (02-JARVIS-CORE §6).
- VR-03 Validators are themselves agents (Verification layer) and subject to
  meta-validation: gate accuracy and false-pass rate are tracked
  (Capability Registry metrics).
- VR-04 Validation results attach to the artifact envelope permanently;
  approval without an attached validation record is impossible by schema.

## 7. Dependency Graph

The runtime projection of the Knowledge Graph (03 §2), extended to artifacts:

- Nodes: artifacts, decisions (EDRs), standards versions, patterns,
  components, DNA sections, capabilities.
- Edges: `derives_from`, `depends_on`, `validates_against`, `affected_by`,
  `supersedes`.

Uses:

- DG-01 **Ordering** — the Execution Engine topologically sorts tasks.
- DG-02 **Impact analysis** — `project.dna_changed` or a standards major bump
  traverses the graph to mark stale artifacts for regeneration (AR-11, DC-08);
  nothing is re-analyzed wholesale.
- DG-03 **Provenance** — every artifact's ancestry is queryable to its DNA
  and constitutional grounding.

## 8. Governance Model (Division of Responsibilities)

| Concern | Claude (Chief Software Architect) | Antigravity (Lead Platform Engineer) |
|---------|-----------------------------------|--------------------------------------|
| Architecture docs (04–07), Constitution | Author + guardian | Consumer |
| Standards conformance review | Reviews every document/artifact before repo acceptance | Submits for review |
| Prompt OS integration (Constraint Engine, EDRs, standards refs, registry refs) | Reviews | Implements |
| Agent OS (universal template + 12 agents) | Reviews specs | Generates |
| Workflows (discovery → knowledge-update) | Reviews | Generates |
| Component specs (auth, dashboard, CRUD, API, payments, notifications, storage, reporting) | Reviews | Produces |
| Industry templates (CRM, ERP, marketplace, inventory, booking, healthcare, education, POS, SaaS starter) | Reviews | Generates |
| New rules | Only via EDR + owner | Never |
| Implementation code | Never first — only after runtime specs are approved | After approval |

Every artifact either party produces declares: inputs, outputs, dependencies,
validation criteria, related standards, and version (doc 06 envelope).

## 9. Runtime Acceptance Criteria (Phase 4 done when…)

1. Event catalogue implemented; events persisted and replayable.
2. Artifact Registry enforces the envelope schema on write.
3. State Machine drives stage transitions exclusively from gate events.
4. Context Engine produces deterministic, budgeted bundles with provenance.
5. Validation Runtime executes the eight-step sequence and blocks on failure.
6. Dependency Graph answers impact queries for a DNA change end-to-end.
7. A dry-run project traverses Discovery → Architecture on synthetic data
   with zero manual intervention.
