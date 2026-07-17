# Industry Playbook Library

**Program A / Milestone 1.** Jarvis and Business OS tailor discovery using these packs — not generic questions for every client.

## Playbooks (seed index)

| Industry | Status | Typical modules | Notes |
|----------|--------|-----------------|-------|
| Hotels / hospitality | Seed | booking, calendar, payments, reviews, notifications | Booking golden ref |
| Restaurants | Planned | booking, orders, payments, inventory | |
| Retail | Planned | products, inventory, payments, search | |
| Logistics | Planned | orders, inventory, notifications, analytics | |
| Healthcare | Planned | authentication, rbac, files, audit | Elevated compliance |
| Education | Planned | authentication, files, analytics, notifications | |
| Manufacturing | Planned | inventory, analytics, rbac, audit | |
| Construction | Planned | files, projects*, analytics | |
| Real Estate | Planned | booking/crm hybrid, files, payments | |
| Legal | Planned | files, audit, rbac, clients* | |
| Finance | Planned | payments, audit, rbac | Elevated security |
| Wholesale / textile distribution | Industry pack seed | inventory, purchasing, credit, warehouse | `knowledge/industries/wholesale-distribution` + competitor pattern cards |

\* = future modules

## Each playbook must contain

1. Typical workflows  
2. Required / recommended modules  
3. Compliance considerations  
4. Common integrations  
5. Suggested upsells  
6. Risk checklist  
7. Discovery question bank (industry-specific)  

## Format (v1)

```
knowledge/playbooks/<industry>/
  PLAYBOOK.md
  discovery-questions.json
  modules.json          # required / optional registry ids
  integrations.json
  risks.json
  upsells.json
```

## Seed: hospitality (links Booking)

See `knowledge/playbooks/hospitality/` (if present) and blueprint `booking`.
