# Grabber Prompt OS

**Status:** Sprint 1 skeleton (structure only).  
**Owner:** Track B product engineering + Track A Prompt OS integration (later).

Prompts are versioned assets. They **reference** standards by rule id — they never
restate the constitution (18-PROMPT / Rule 1). Full agent prompts fill in Sprint 2.

## Layout

```
grabber-prompt-os/
  system/           # platform-level system prompts
  agents/           # per-agent prompts (orchestrator, BA, architect, …)
  handoffs/         # JSON schemas for agent-to-agent handoffs
  constraints/      # constraint-block seeds
  templates/        # reusable prompt templates
```

## Rules

1. One home per prompt (no copies).
2. Every agent prompt lists `related_standards: [AR-01, …]`.
3. Constraint blocks use PR-04 keys: must / should / may / must_not / assumptions / unknowns / risks.
4. Changes that affect architecture require an EDR.

## Relation to Core

Grabber AI Studio **Core** (runtime, IEP, Product Factory) is the platform.
Prompt OS content is **knowledge + configuration** consumed by the Agent Runtime
(v1.7), not a parallel orchestrator.
