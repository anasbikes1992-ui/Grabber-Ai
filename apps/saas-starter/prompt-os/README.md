# Product Intelligence Layer — SaaS Starter (Sprint 2)

This folder is **product-side** prompt configuration.

It does **not** implement orchestration. Jobs are submitted to:

```
Grabber Core → Product Factory → IEP builders
```

## Layout

```
prompt-os/          versioned prompts
prompts/            discovery … deployment
schemas/            JSON contracts (sibling ../schemas)
jobs/               builder job manifests (sibling ../jobs)
handoffs/           inter-step schemas (sibling ../handoffs)
```

## Versioning

See `version.json`. Bump prompt versions when semantics change; record in DNA
`project.intelligence.prompt_versions`.

## Pipeline

Implemented in `src/intelligence/` (deterministic extraction for offline CI).
LLM swap later without changing handoff contracts.
