# 02 — JARVIS CORE

**Parent:** [MASTER.md](../MASTER.md)
**Status:** Complete
**Version:** 1.0.0

Jarvis is the brain: the AI CEO + CTO of the platform. It thinks, plans,
routes, validates, and learns. **It never writes code and never edits files
directly.** Workers write; Jarvis decides.

---

## 1. Position in the Architecture

```
                Grabber AI Studio
                       │
                  JARVIS CORE
     (Brain + Memory + Knowledge + Planning)
                       │
   ┌───────────────────┼───────────────────┐
   ▼                   ▼                   ▼
Business           Engineering         Operations
Intelligence       Intelligence        Intelligence
   │                   │                   │
   ▼                   ▼                   ▼
Clients         Multi-Agent Factory    Deployment
```

## 2. Core Modules

```
jarvis/
├── memory/          short-term, long-term, semantic, project, personal
├── planner/         decomposes goals into staged plans with gates
├── reasoner/        trade-off analysis, decision proposals
├── knowledge/       interface to the Knowledge Engine (doc 03)
├── router/          model/tool selection per task (§3)
├── orchestrator/    assigns work, sequences pipeline stages
├── validators/      gate scoring, spec-conformance checks
├── security/        runs the security suite (01 §8)
├── learning/        post-project analysis → knowledge updates (§8)
├── communications/  client + internal messaging
└── analytics/       metrics collection and dashboards (01 §6)
```

Design constraints (from MASTER Engineering Philosophy): the orchestrator stays
simple; agents are stateless where possible; memory is centralized here — never
duplicated into agents.

## 3. Brain Router (Model-Agnostic by Design)

No single LLM. Every task is routed to the best available engine by **role**:

| Role | Routed to (binding is config, not code) |
|------|------------------------------------------|
| Orchestration, planning, validation, context management | Jarvis's primary reasoning model |
| Implementation-heavy coding | Best available coding model/agent |
| Architecture review, refactoring, long-context reasoning | Long-context model |
| Documentation, structured outputs | Most reliable structured-output model |
| Indexing, embedding, low-cost bulk tasks | Local/open-source models (Qwen, DeepSeek class) |

Routing rules live in `jarvis/router/` config. Swapping a model is a config
change plus an eval run — never a rewrite (Rule 2). The router logs every
routing decision with cost and outcome for the Learning Engine.

## 4. Memory (Five Layers, Centralized)

| Layer | Contents | Lifetime |
|-------|----------|----------|
| Short-term | current task/project context window | task |
| Long-term | company knowledge, distilled facts | permanent |
| Semantic | relationships between concepts (graph) | permanent |
| Project | everything about one client engagement | engagement + archive |
| Personal | user/client preferences and past decisions | permanent |

Agents receive **scoped slices** of memory from Jarvis per task. Agents never
maintain private memory — that would duplicate context and break Rule 1.

## 5. Orchestration & Agent Hierarchy

One direction, no circular conversations:

```
Jarvis → Project Manager → Architect → Planner → Engineering Lead
       → Workers → Validators → QA → Deployment
```

The orchestrator's job per stage: fetch context (knowledge + memory + standards)
→ assign to agent → receive output → hand to validator → score against gate
(01 §3) → advance or loop back. Escalations travel up the hierarchy; work
products travel down.

## 6. Validation Engine

```
Planner → Validator → approved? → Worker → Validator → approved? → Merge
```

- Workers never approve themselves.
- Validators score against explicit rubrics from `/standards`.
- A failed validation returns a structured correction list, not prose.
- Two consecutive failures on the same item escalate to the Thinking Layer.

## 7. Decision Engine

Every important decision is stored (template:
[DECISION-RECORD-TEMPLATE.md](../templates/DECISION-RECORD-TEMPLATE.md)):
decision, reason, alternatives, trade-offs, impact, risk, owner, date, status.

Future agents read the registry to understand *why* something was built a
certain way. Requirement changes trigger a registry query to find affected
decisions and artifacts (01 §4).

## 8. Learning Engine

Every completed project must answer:

- What went well? What failed?
- Which prompts were effective? Which components were reused?
- Where did humans intervene? How much time/tokens were spent?

Answers become structured updates: new/updated patterns, playbooks, mistakes
(`knowledge/mistakes/`), solutions, prompt revisions, and gate-threshold
tuning proposals. A project is not "closed" until its learning report is merged
into the Knowledge Engine.

## 9. What Jarvis Must Never Do

- Write or edit application code or files directly
- Approve its own plans (validators do)
- Bypass a confidence gate
- Make an unrecorded significant decision
- Guess when a standard or pattern is missing (escalate instead)
