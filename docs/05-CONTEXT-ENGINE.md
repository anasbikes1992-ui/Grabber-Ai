# 05 — CONTEXT ENGINE

**Parent:** [04-RUNTIME-ARCHITECTURE.md](04-RUNTIME-ARCHITECTURE.md)
**Status:** Approved · **Version:** 1.0.0
**Runtime home:** `runtime/context/`

How Jarvis builds context. The Context Engine is what makes agents small
(AG-01): every task receives one deterministic, budgeted, provenance-tracked
**context bundle** — and nothing else.

---

## 1. The Context Bundle

```yaml
bundle:
  id: ctx_<ulid>
  task: ""                  # task id and type
  agent: ""                 # target agent spec + version
  project_dna:              # relevant DNA sections only, with version hash
  constraints: {}           # constraint block (18-PROMPT PR-04), specialized per task
  standards:                # bound standards for this agent + task type
    - id: ""                # e.g. 03-DATABASE
      version: ""
      rules: []             # only the rule ids applicable to this task
  knowledge:                # results of typed knowledge queries (03-KE §3)
    - entry: ""
      reason: ""            # why included
  decisions:                # EDRs affecting this task (via Dependency Graph)
    - edr: ""
      relevance: ""
  artifacts:                # upstream artifacts this task consumes (doc 06 ids)
    - id: ""
      role: input | reference
  memory:                   # scoped slices (02-JARVIS-CORE §4) — never raw memory
    - layer: project | personal | semantic
      slice: ""
  output_contract:          # expected artifact type + schema (doc 06)
  budget:
    tokens: 0
    rationale: ""
  provenance:
    assembled_at: ""
    assembler_version: ""
    inputs_hash: ""         # determinism check (CE-01)
```

## 2. Assembly Pipeline

```
task.created
  → resolve agent spec + capability (Capability Registry: is this doable?)
  → collect: DNA sections → bound standards → knowledge queries
             → EDRs via Dependency Graph → upstream artifacts → memory slices
  → specialize constraint block (Planner output + DNA constraints)
  → prioritize & prune to budget (§3)
  → attach output contract + provenance
  → validate bundle (§4)
  → hand to Router → Agent Runtime
```

## 3. Rules

- CE-01 **Deterministic:** same inputs (task, DNA hash, standards versions,
  artifact set, knowledge state) MUST produce the same bundle (`inputs_hash`
  makes this checkable; replay is a test).
- CE-02 **Complete:** every item an agent may rely on is in the bundle;
  agents fetching outside the bundle violate AG-01 and fail validation.
- CE-03 **Minimal:** pruning follows a fixed priority — constraints >
  output contract > standards rules > upstream artifacts > EDRs > knowledge >
  memory. Nothing decision-bearing is pruned; if the budget cannot hold the
  decision-bearing set, the task MUST be split by the Planner, not the bundle
  silently truncated.
- CE-04 **Referenced, not restated:** standards content is injected by
  reference id + the applicable rule texts at their current version (PR-02);
  the bundle never paraphrases a rule.
- CE-05 **Unknown-safe:** unresolved `unknowns` from the constraint block stay
  visible in the bundle; the engine never resolves an unknown by omission.
- CE-06 **Provenanced:** every bundle is stored and linked from the artifact
  it produced (OB-10); an artifact whose bundle is missing fails audit.
- CE-07 **Cached knowledge, versioned:** caches key on entry version +
  `last_validated`; a stale entry (03-KE §1) is flagged in the bundle, not
  silently included.

## 4. Bundle Validation (pre-dispatch)

Rejected before dispatch if: constraint block missing (PR-04) · output
contract missing · a bound standard unresolved · a `must` constraint
contradicts a standard (governance conflict → `governance.conflict_detected`
event, Constitution precedence applies) · budget exceeded after pruning.

## 5. Interfaces

- **In:** `task.created` events (Event Bus), Dependency Graph queries,
  Knowledge Engine typed queries, Artifact Registry reads, Memory reads.
- **Out:** validated bundles to the Router; `task.dispatched` events;
  bundle records to `runtime/telemetry/`.
