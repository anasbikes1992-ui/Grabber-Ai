# 06 — ARTIFACT MODEL

**Parent:** [04-RUNTIME-ARCHITECTURE.md](04-RUNTIME-ARCHITECTURE.md)
**Status:** Approved · **Version:** 1.0.0
**Runtime home:** `runtime/artifacts/`

Defines every generated object. If the platform produced it, it is an
artifact with an envelope, a lifecycle, and a place in the Dependency Graph.
Anonymous outputs cannot exist (Article V).

---

## 1. Artifact Types (v1)

| Type | Examples | Producing layer |
|------|----------|-----------------|
| `document.prd` | PRD, user stories | Thinking |
| `document.architecture` | architecture doc, diagrams | Thinking |
| `document.edr` | decision records | Thinking |
| `document.plan` | task breakdown, milestones | Thinking |
| `design.system` | tokens, component inventory | Thinking |
| `schema.database` | schema + policies | Building |
| `schema.migration` | migration scripts | Building |
| `contract.api` | OpenAPI etc. (AP-01) | Building |
| `code.module` | source modules | Building |
| `suite.test` | test suites | Building |
| `config.pipeline` | CI/CD, IaC | Building |
| `report.validation` | gate scores, correction lists | Verification |
| `report.security` | security findings | Verification |
| `report.learning` | post-project learning report | Verification |
| `docs.delivered` | README, runbooks, guides (DC-01) | Building |
| `knowledge.entry` | patterns, playbooks, mistakes | Learning Engine |

New types require a minor version bump of this model; agents cannot invent
types (AG-03).

## 2. The Envelope (every artifact, no exceptions)

```yaml
artifact:
  id: art_<ulid>
  type: ""                    # from §1
  version: x.y.z              # semver per GT-07
  project: ""                 # or "platform"
  stage: ""                   # lifecycle stage that produced it
  state: draft                # lifecycle §3
  producer:
    agent: ""                 # agent spec + version
    prompt_version: ""
    standards_version: ""     # standards set hash (DNA pin)
    context_bundle: ctx_…     # CE-06 provenance
  inputs: []                  # upstream artifact ids
  outputs_declared: []        # what it claims to satisfy (acceptance criteria ids, rule ids)
  dependencies: []            # Dependency Graph edges (derives_from / depends_on)
  validation:                 # attached by Validation Runtime (VR-04)
    status: pending | passed | failed
    gate: ""
    score: null
    report: art_…             # report.validation artifact id
  related_standards: []       # rule ids it must satisfy
  related_edrs: []
  checksum: ""                # content hash — envelopes are tamper-evident
  created_at: ""
  superseded_by: null
```

## 3. Lifecycle

```
draft ──validated──▶ approved ──merged──▶ active ──superseded──▶ archived
  │                     ▲
  └──failed──▶ corrected┘        (two failures → task.escalated, Article VI)
```

- AM-01 Only `approved` artifacts may be consumed as inputs by other tasks
  (except validators, which consume `draft`).
- AM-02 `merged`/`active` artifacts are immutable; changes produce a new
  version that `supersedes` the old — history is never rewritten (GT-10).
- AM-03 Every state change emits an `artifact.*` event; the registry is the
  single source of truth for artifact state (Article I).

## 4. Derivation Rule (DNA is upstream of everything)

- AM-04 Every project artifact MUST trace `derives_from` — directly or
  transitively — to sections of the Project DNA file.
- AM-05 On `project.dna_changed`, the Dependency Graph marks affected
  artifacts `stale`; stale artifacts are **regenerated**, not hand-patched
  (AR-11, DC-08). Regeneration reuses the same task type with a fresh
  context bundle.
- AM-06 An artifact that cannot state what DNA section or acceptance
  criterion it serves fails validation — it has no reason to exist.

## 5. The Artifact Registry (`runtime/artifacts/`)

Responsibilities: enforce the envelope schema on write (04 §9.2) · assign
ids and checksums · persist all versions · serve typed queries (by project,
type, state, stage, dependency) · emit events · refuse writes from agents
whose layer may not produce that type (AG-05, Article VI — enforced by
type system, not convention).
