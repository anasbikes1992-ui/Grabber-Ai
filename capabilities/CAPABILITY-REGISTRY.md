# CAPABILITY REGISTRY

Instead of asking "Can Jarvis do this?" — Jarvis knows. Every platform
capability is documented with dependencies, owner, and status. Jarvis
consults this registry before accepting a task; a task requiring a
non-Complete capability is either escalated or scheduled, never attempted
blind.

Major version bumps of a dependency (GT-07) flag every capability that
depends on it for re-validation.

## Entry format

```yaml
capability:
  name: ""
  status: Planned | In Development | Complete | Degraded
  owner: ""            # owning agent or human role
  version: ""          # semver
  depends_on: []       # standards, engines, other capabilities
  validated_by: ""     # which validator + rubric
  metrics: []          # how its effectiveness is measured (01-OS §6)
```

## Registry

```yaml
- capability:
    name: Foundation Documentation
    status: Complete
    owner: Platform
    version: 1.0.0
    depends_on: [MASTER, 00-VISION, 01-OPERATING-SYSTEM, 02-JARVIS-CORE, 03-KNOWLEDGE-ENGINE]
    validated_by: Documentation validator (13-DOCUMENTATION)
    metrics: [doc completeness, link integrity]

- capability:
    name: Engineering Standards
    status: Complete
    owner: Platform
    version: 1.0.0
    depends_on: [Foundation Documentation]
    validated_by: standards format check (00-STANDARDS-INDEX)
    metrics: [rubric coverage, exception count]

- capability:
    name: Engineering Constitution
    status: Complete (FROZEN, EDR-001)
    owner: Platform
    version: 1.0.0
    depends_on: [Foundation Documentation, Engineering Standards]
    validated_by: governance review (owner ratification)
    metrics: [conflict events, amendment count]

- capability:
    name: Runtime Architecture Specification
    status: Complete (FROZEN, EDR-001)
    owner: Chief Software Architect (Claude)
    version: 1.0.0
    depends_on: [Engineering Constitution, Engineering Standards]
    validated_by: architecture review vs Constitution
    metrics: [spec-to-implementation drift]

- capability:
    name: Event Bus
    status: Complete (Sprint 1 in-memory reference, EDR-002)
    owner: Chief Software Architect (Claude)
    version: 0.1.0
    depends_on: [Runtime Architecture Specification]
    validated_by: catalogue conformance + idempotency tests (EH-09)
    metrics: [event replay integrity, handler idempotency violations]

- capability:
    name: Artifact Registry
    status: Complete (Sprint 1 in-memory reference, EDR-002)
    owner: Chief Software Architect (Claude)
    version: 0.1.0
    depends_on: [Artifact Model (docs/06), Event Bus]
    validated_by: envelope schema + layer/stage rejection tests
    metrics: [schema rejection rate, provenance completeness]

- capability:
    name: Project State Machine
    status: Complete (Sprint 1 in-memory reference, EDR-002)
    owner: Chief Software Architect (Claude)
    version: 0.1.0
    depends_on: [Event Bus, Artifact Registry]
    validated_by: invariant checks (docs/07 §4) — loopback/escalation/closure tests
    metrics: [invalid transition attempts, time-in-state vs SLA]

- capability:
    name: Context Engine
    status: Complete (Sprint 1 in-memory reference, EDR-002)
    owner: Chief Software Architect (Claude)
    version: 0.1.0
    depends_on: [Knowledge Engine, Project DNA, Constraint Engine]
    validated_by: bundle validation rules (docs/05 §4) + determinism replay (CE-01)
    metrics: [bundle determinism rate, pruning escalations]

- capability:
    name: Validation Runtime
    status: Complete (Sprint 1 in-memory reference, EDR-002)
    owner: Chief Software Architect (Claude)
    version: 0.1.0
    depends_on: [Engineering Standards, Artifact Registry]
    validated_by: eight-step sequence tests + VR-04 approval-impossible test
    metrics: [gate accuracy, false-pass rate]

- capability:
    name: Execution Engine
    status: Complete (Sprint 1 in-memory reference, EDR-002)
    owner: Chief Software Architect (Claude)
    version: 0.1.0
    depends_on: [Event Bus, Context Engine, Artifact Registry, Project State Machine, Validation Runtime]
    validated_by: acceptance tests runtime/test/dry-run.test.js (docs/04 §9; §9.6 Dependency Graph deferred to Sprint 2)
    metrics: [replay determinism, dispatch provenance coverage]

- capability:
    name: Policy Engine
    status: Complete (Sprint 1, sanctioned by EDR-001)
    owner: Chief Software Architect (Claude)
    version: 0.1.0
    depends_on: [Event Bus]
    validated_by: policy trigger + block/unblock tests
    metrics: [policy triggers, blocked actions, exception grants]

- capability:
    name: System Health Monitor
    status: Complete (Sprint 1, sanctioned by EDR-001)
    owner: Chief Software Architect (Claude)
    version: 0.1.0
    depends_on: [Event Bus, Telemetry, Context Engine]
    validated_by: snapshot metric tests
    metrics: [event queue depth, gate success rate, intervention rate, context size, cost]

- capability:
    name: Dependency Graph
    status: Complete (Sprint 2 / v1.5, EDR-004)
    owner: Lead Platform Engineer (Antigravity)
    version: 0.2.0
    depends_on: [Knowledge Engine, Artifact Registry, Decision Registry]
    validated_by: runtime/test/sprint2.test.js §9.6 impact-analysis
    metrics: [impact query accuracy, stale-artifact detection rate]

- capability:
    name: Infrastructure Services (Knowledge, Decision, Capability, Pattern, DNA, Rule, Artifact Query)
    status: Complete (Sprint 2 / v1.5 — APIs, EDR-004)
    owner: Lead Platform Engineer (Antigravity)
    version: 0.2.0
    depends_on: [Sprint 1 runtime services]
    validated_by: runtime/test/sprint2.test.js Foundation API contracts
    metrics: [contract drift, query latency]

- capability:
    name: Storage Contracts (Document / Graph / Vector)
    status: Complete (Sprint 2 / v1.5 contracts + SCHEMA; adapters deferred)
    owner: Lead Platform Engineer (Antigravity)
    version: 0.2.0
    depends_on: [Infrastructure Services]
    validated_by: Memory providers in tests; SCHEMA.md for PG/Redis/vector
    metrics: [adapter swap without business-logic change]

- capability:
    name: Platform Extension Framework
    status: Complete (v1.6, EDR-005)
    owner: Lead Platform Engineer (Antigravity)
    version: 0.1.0
    depends_on: [Infrastructure Services, Execution Engine]
    validated_by: runtime/test/extensions.test.js + packages/cli + packages/sdk tests
    metrics: [extension install success, lifecycle violations]

- capability:
    name: Grabber SDK
    status: Complete (v1.6, EDR-005)
    owner: Lead Platform Engineer (Antigravity)
    version: 0.1.0
    depends_on: [Infrastructure Services]
    validated_by: packages/sdk/test/sdk.test.js
    metrics: [contract drift]

- capability:
    name: Grabber CLI
    status: Complete (v1.6, EDR-005)
    owner: Lead Platform Engineer (Antigravity)
    version: 0.1.0
    depends_on: [Grabber SDK, Platform Extension Framework]
    validated_by: packages/cli/test/cli.test.js
    metrics: [doctor pass rate]

- capability:
    name: Intelligent Execution Platform
    status: Complete (v1.7, EDR-006)
    owner: Lead Platform Engineer (Antigravity)
    version: 0.1.0
    depends_on: [Execution Engine, Platform Extension Framework]
    validated_by: runtime/test/iep.test.js
    metrics: [runtime reliability, cost per execution, retry rate, intervention rate]

- capability:
    name: Agent Runtime (Agent Interface)
    status: Complete (v1.7 — agents are configuration/jobs on IEP)
    owner: Lead Platform Engineer (Antigravity)
    version: 0.1.0
    depends_on: [Intelligent Execution Platform]
    validated_by: agent lifecycle + scheduleAgent tests in iep.test.js
    metrics: [agent correction rate, escalation rate]

- capability:
    name: Runtime Recorder
    status: Complete (v1.7, EDR-006)
    owner: Lead Platform Engineer (Antigravity)
    version: 0.1.0
    depends_on: [Intelligent Execution Platform]
    validated_by: replay envelope tests
    metrics: [replay completeness]

- capability:
    name: Memory Service
    status: Complete (v1.7, EDR-006)
    owner: Lead Platform Engineer (Antigravity)
    version: 0.1.0
    depends_on: [Intelligent Execution Platform]
    validated_by: layered memory tests
    metrics: [layer isolation]

- capability:
    name: Product Factory
    status: Complete (v1.8, EDR-007)
    owner: Lead Platform Engineer (Antigravity)
    version: 0.1.0
    depends_on: [Intelligent Execution Platform, Infrastructure Services]
    validated_by: runtime/test/product-factory.test.js (regen equivalence ×3 templates)
    metrics: [dna_to_deployable_ms, intervention_rate, regen_equivalence, cost_per_project]

- capability:
    name: Production Templates (SaaS, CRM, Marketplace)
    status: Complete (v1.8 DNA + factory proofs)
    owner: Product Engineering
    version: 0.1.0
    depends_on: [Product Factory]
    validated_by: reference-projects regression suite
    metrics: [template build success, domain coverage]

- capability:
    name: Prompt OS
    status: Planned (Sprint 2/3 integration)
    owner: Lead Platform Engineer (Antigravity)
    version: —
    depends_on: [Engineering Standards (18-PROMPT), Knowledge Engine, Constraint Engine]
    validated_by: Prompt validator (18-PROMPT rubric)
    metrics: [prompt success rate, correction rate]

- capability:
    name: Requirements Analysis
    status: Planned
    owner: Business Analyst
    version: —
    depends_on: [Agent Runtime, Knowledge Engine, Prompt OS, Validation Runtime]
    validated_by: Requirements validator
    metrics: [PRD completeness, change-request rate]

- capability:
    name: Development Factory
    status: Planned (Sprint 3+)
    owner: Lead Platform Engineer (Antigravity)
    version: —
    depends_on: [Agent Runtime, Validation Runtime, Pattern Library, Project DNA]
    validated_by: full gate sequence (01-OS §3)
    metrics: [build success rate, manual intervention rate]
```

New capabilities are appended here with status `Planned` before any work
starts on them (no undocumented capabilities).
