# 07 — PROJECT STATE MACHINE

**Parent:** [04-RUNTIME-ARCHITECTURE.md](04-RUNTIME-ARCHITECTURE.md)
**Status:** Approved · **Version:** 1.0.0
**Runtime home:** `runtime/state-machine/`

Defines the lifecycle of every project. The state machine is the only
authority on "where a project is"; the Execution Engine derives all work
from it (04 §3). Transitions are driven exclusively by events — never by
opinion.

---

## 1. States

The 14 lifecycle stages (01-OPERATING-SYSTEM §1) are the primary states:

```
intake → discovery → analysis → requirements → architecture → planning
 → design_system → data_architecture → development → verification
 → security → performance → deployment → monitoring → improvement → closed
```

Plus three orthogonal conditions any stage can enter:

| Condition | Meaning | Exit |
|-----------|---------|------|
| `blocked` | waiting on client/external dependency | unblocking event + resume to same stage |
| `escalated` | governance conflict or repeated gate failure | human/owner resolution event |
| `paused` | commercial hold | resume or terminate |

Terminal states: `closed` (learning report merged — Article III.3) and
`terminated` (commercial end; still requires a learning report).

## 2. Transition Rules

- SM-01 A stage advances **only** on `gate.passed` for that stage's gate
  (01-OS §3). No gate, no transition (Article VII).
- SM-02 `gate.failed` triggers a **loopback** to the owning stage with the
  validator's correction list attached; the Execution Engine re-derives the
  corrective tasks. Two consecutive failures of the same gate →
  `escalated` (Article VI).
- SM-03 Stages MUST NOT be skipped. A stage may be **trivially satisfied**
  (e.g., design_system for a headless API) only via an intake rule or an
  Accepted EDR — recorded, never implicit.
- SM-04 `project.dna_changed` mid-flight sends the project to the earliest
  stage owning an affected artifact (per Dependency Graph impact analysis,
  04 §7 DG-02) — not to the beginning.
- SM-05 `deployment` requires: gate at 100% (DO-09), monitoring live
  (OB-07), rollback rehearsed (DO-07). The state machine checks all three
  events, not a checklist claim.
- SM-06 `closed` is reachable only after `learning.report_ready` and
  `knowledge.entry_merged` events (03-KE §4).

## 3. Diagram

```
                 ┌───────────────loopback (gate.failed)──────────────┐
                 ▼                                                   │
intake → … → stage N ──gate.passed──▶ stage N+1 → … → deployment → monitoring
                 │                                        │
                 │ two failures                           │ incident
                 ▼                                        ▼
             escalated ──resolved──▶ stage N       (incident workflow,
                                                    loopback per impact)
monitoring → improvement ──learning merged──▶ closed
any stage ⇄ blocked / paused
```

## 4. Invariants (checked continuously)

- INV-1 Exactly one primary state per project at all times.
- INV-2 Every transition has a causing event with full provenance; the
  transition log is append-only (event bus, 04 §4).
- INV-3 No artifact may be produced for a stage the project has not reached
  (the Artifact Registry rejects stage-mismatched writes).
- INV-4 A project in `escalated` accepts no new Building-layer tasks.
- INV-5 Time-in-state is metered (01-OS §6 business metrics); breaching the
  declared stage SLA raises a governance event, not silence.

## 5. Per-Stage Definition Format

Each stage is declared in `runtime/state-machine/` as configuration:

```yaml
stage:
  name: ""
  entry_criteria: []      # events/artifacts required to enter
  workflow: ""            # pipeline definition that generates its tasks
  produces: []            # artifact types owed (doc 06 §1)
  gate:
    rubrics: []           # standards rubrics that compose the score
    threshold: 0          # from 01-OS §3
  sla: ""                 # expected duration for qualifying projects
  trivial_satisfaction: none | intake-rule | edr
```

The state machine executes these declarations; it contains no per-stage
logic of its own (RT-02 — the engine sequences, standards decide).
