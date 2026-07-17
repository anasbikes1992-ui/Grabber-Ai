# Product Blueprints

Reusable **product recipes** over independent business modules.

```
blueprints/
  saas/          CRM/  marketplace/  booking/  inventory/
  registry.json
```

Each blueprint defines:

- required / optional modules
- recommended integrations
- deployment defaults
- quality policies (confidence, completeness, min reuse)
- target KPIs

DNA stays declarative:

```json
{
  "product": { "type": "booking" },
  "modules": ["authentication", "calendar", "booking", "payments", "..."],
  "integrations": ["supabase", "stripe", "github", "vercel"]
}
```

Materialize via `src/blueprints` or `POST /api/blueprints`.

Golden references live in `reference-projects/` and run through:

```
npm run test:booking
```
