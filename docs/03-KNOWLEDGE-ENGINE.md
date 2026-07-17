# 03 — KNOWLEDGE ENGINE

**Parent:** [MASTER.md](../MASTER.md)
**Status:** Complete
**Version:** 1.0.0

The Knowledge Engine is the company's biggest asset. Not prompts — knowledge.
Its goal: **never ask AI the same question twice**, and let AI *navigate*
knowledge rather than search random text.

---

## 1. Structure (Single Source of Truth)

```
knowledge/
  business/        market patterns, pricing, proposals, discovery playbooks
  industries/      retail, healthcare, construction, education, travel, …
  patterns/        marketplace, CRM, ERP, booking, POS, …
  architecture/    reference architectures, decision-rules.md, trade-off notes
  security/        threat models, hardening guides, RLS patterns
  components/      reusable UI/auth/forms/dashboard building blocks (specs)
  prompts/         versioned prompt assets used by agents
  playbooks/       step-by-step procedures (integrations, migrations, launches)
  checklists/      gate checklists, deployment checklists, review checklists
  examples/        exemplary outputs (PRDs, architectures, specs)
  mistakes/        catalogued failures and their root causes
  solutions/       proven fixes mapped to mistakes
```

Rules:

- Every entry has exactly one home (Rule 1). Cross-references link; they never copy.
- Every entry carries frontmatter: `id`, `type`, `industry`, `pattern`,
  `status`, `source_project`, `last_validated`.
- Entries without `last_validated` within 12 months are flagged stale by the
  Learning Engine.

## 2. The Knowledge Graph

Folders store; the graph connects. Everything is indexed as nodes and edges:

```
Industry ──has──▶ Features ──implemented-by──▶ Patterns
Patterns ──composed-of──▶ Components ──backed-by──▶ Database Models
Components ──exposed-via──▶ API Patterns ──documented-in──▶ Documentation
Decisions ──affects──▶ any node
Mistakes ──resolved-by──▶ Solutions
Projects ──instantiates──▶ Patterns, Components, Decisions
```

This is what enables:

- **Reuse:** new retail-booking project → graph returns the booking pattern, its components, DB models, API patterns, prior decisions, and known mistakes in one query.
- **Impact analysis:** requirement change → traverse `Decision ──affects──▶` edges to find exactly what must be revisited (01 §4).

## 3. Retrieval Contract (How Agents Use It)

Agents never free-search the repository. They query Jarvis's knowledge module
with a typed request:

```
{ intent: "pattern-lookup" | "standard" | "playbook" | "prior-decision" | "mistake-check",
  industry?, pattern?, feature?, stage? }
```

The knowledge module returns ranked entries **plus the standards that bind
them**. An agent acting without a knowledge query on a decision-bearing task
violates Rule 4 and fails validation.

## 4. Enrichment Loop (Knowledge Compounds)

Every finished project enriches the base — enforced, not optional:

```
Project closes
  → Learning Engine report (02 §8)
  → Extracted: new patterns, component specs, playbook updates,
    mistakes + solutions, prompt revisions
  → Curated (validator review — knowledge has gates too)
  → Merged with frontmatter + graph edges
  → Project archived with links into the graph
```

Curation gate: an entry enters the base only if it is (a) generalized beyond
the single client, (b) linked into the graph, (c) non-duplicative (Rule 1).

## 5. Relationship to Standards and Prompts

- `/standards` are knowledge with **binding force** — validators score against them.
- `knowledge/prompts/` are versioned assets owned by the Prompt OS (Phase 4);
  their effectiveness metrics come from the Learning Engine.
- Templates in `/templates` define the *shape* of knowledge entries; the engine
  rejects entries that don't conform.
