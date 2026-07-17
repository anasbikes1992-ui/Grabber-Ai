# ENGINEERING CONSTITUTION

**Status:** Ratified · **Version:** 1.0.0 · **Owner:** Anaz
**Amendment procedure:** Article X. The foundation is frozen as of 2026-07-15.

The immutable rules of Grabber AI Studio. Everything else — standards,
runtime, agents, prompts, projects — operates under this document.

---

## Precedence Order

When documents conflict, higher wins:

```
1. Constitution (this document)
2. Standards            (/standards)
3. Accepted EDRs        (/decisions)
4. Agent specs, workflows, templates
5. Playbooks and knowledge entries
6. Anything else
```

A conflict discovered at runtime halts the affected task and raises a
governance event — it is never resolved ad hoc by an agent.

---

## Article I — Truth

1. Every fact, rule, and definition has exactly one home. All other
   references link; they never copy.
2. Duplicated normative text is a defect wherever it appears.

## Article II — Modularity

1. No module, agent, prompt, or pipeline may depend on a specific model,
   framework, cloud, or vendor except through a declared, replaceable adapter.
2. Model and tool bindings are configuration, never code or prose.

## Article III — Reuse

1. Every project must produce at least one reusable asset.
2. A solution used twice must be generalized into the Pattern Library.
3. A project is not closed until its learning report is merged.

## Article IV — Grounding

1. AI never guesses. Every decision-bearing action must cite the standards,
   knowledge, EDRs, and constraints it acted under.
2. A missing standard, pattern, or decision triggers escalation — never
   improvisation.
3. Every task carries a constraint block; unknowns are escalated, not invented.

## Article V — Decisions

1. Every meaningful decision is recorded as an EDR before implementation.
2. No artifact may exist whose reasoning cannot be traced (full provenance:
   agent, prompt version, standards version, context bundle, EDRs).

## Article VI — Separation of Powers

1. Thinking agents never generate code. Building agents never decide
   features. Verification agents never build.
2. No agent approves its own output. Validators score against rubrics;
   workers write.
3. The orchestration hierarchy is one-directional; circular agent
   conversations are prohibited.

## Article VII — Gates

1. No artifact advances past a failing confidence gate.
2. Gate scores are computed by validators against published rubrics — never
   self-reported.
3. The Deployment gate is 100%; it admits no partial credit and no unsigned
   exceptions.

## Article VIII — Security

1. Security is a rule, not a phase. Every pipeline runs the security suite.
2. A critical security finding blocks progression regardless of any other
   score.

## Article IX — Measurement

1. Every project exposes business, engineering, and AI metrics.
2. Every pipeline run records routing, scores, cost, duration, and
   interventions.
3. Unmeasured behavior may not be relied upon.

## Article X — Amendment

1. This constitution changes only by an Accepted EDR with owner sign-off,
   a major version bump, and re-validation of all dependents via the
   Capability Registry.
2. Standards change by their own versioning rules (GT-07) but may never
   contradict this document.
3. Nothing in a prompt, agent spec, workflow, or project may suspend a
   constitutional article. There are no emergency powers.

---

## Governance Roles

| Role | Held by | Authority |
|------|---------|-----------|
| Owner | Anaz | Ratifies amendments, signs Deployment-gate exceptions and intake overrides |
| Chief Software Architect | Claude | Designs and reviews architecture; guardian of Constitution/Standards conformance; approves documents into the repository |
| Lead Platform Engineer | Antigravity | Implements approved architecture; builds Prompt OS integrations, Agent OS, workflows, specs, templates; introduces no new rules |
| Validators | Verification-layer agents | Score gates; reject non-conforming artifacts |

The full division of responsibilities is specified in
[docs/04-RUNTIME-ARCHITECTURE.md §8](../docs/04-RUNTIME-ARCHITECTURE.md).
