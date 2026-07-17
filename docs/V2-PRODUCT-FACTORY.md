# Grabber AI Studio v2.0 — Product Factory

**Grabber Core is FROZEN.** v2.0 completes the commercial Product Factory on Core.  
Full hierarchy & Jarvis OS vision: [ARCHITECTURE-V2.md](./ARCHITECTURE-V2.md)

## Pipeline

```
Project DNA → Deterministic Assembly → Production-Ready Application
  → Deployment → Factory Metrics
```

## Surfaces

| API | Purpose |
|-----|---------|
| `GET /api/factory/catalog` | Factory Registry v2 (modules, blueprints, quality, reuse) |
| `GET /api/factory/analytics` | History, trends, cost, interventions |
| `GET/POST /api/products` | Product catalog |
| `POST /api/products/:id` | build \| regenerate \| deploy \| archive \| validate \| clone |
| `GET/POST /api/blueprints` | Blueprint list / materialize |
| `POST /api/reference/run` | Golden references |
| `POST /api/modules/assemble` | Module assembly |
| `POST /api/intake/run` | Intake → DNA |

## CLI

```bash
grabber create booking my-book
grabber build my-book
grabber regenerate my-book
grabber validate my-book
grabber deploy my-book
grabber status
grabber metrics
grabber doctor
grabber catalog
grabber reference all
```

## Constraints (unchanged)

- No new orchestrator / runtime / Core redesign
- Deterministic, replayable, testable
- Metrics stored under `.grabber/`

## Version

- Product Factory: **2.0.0**
- Grabber Core: **1.8.x frozen**
