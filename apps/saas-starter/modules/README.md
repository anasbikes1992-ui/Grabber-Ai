# Factory Registry — Business Modules (Sprint 5)

Portable, versioned **business capabilities** — not CRUD generators.

```
Project DNA.modules[]
        ↓
Compatibility (requires / conflicts / supports)
        ↓
Assembly (entities, API, UI, tests, docs)
        ↓
Grabber Core Product Factory
```

## Layout per module

```
modules/<id>/
  builder.json                 # version, requires, supports, artifacts
  project-dna.fragment.json    # DNA contributions
  schema/  api/  frontend/  backend/  tests/  docs/
```

## Registry

See `registry.json` for the full catalog and versions.

Regenerate manifests: `node modules/_generate-manifests.mjs`

## Metric

**Module Reuse Rate** = assembled catalog modules / resolved module graph  
Higher reuse ⇒ faster builds, fewer defects, more predictable regeneration.
