# Golden reference products

Regression suite for the software factory.

| Product | Blueprint | Proves |
|---------|-----------|--------|
| saas | saas | Multi-tenant baseline |
| crm | crm | Pipeline / teams |
| marketplace | marketplace | Payments + inventory + search |
| **booking** | booking | Sprint 6 — scheduling + pay + notify + reviews |

Each has declarative `project-dna.json`. Success = assemble from catalog,
Core build, regeneration equivalence, integration plan, high module reuse.

```bash
npm run test:booking
# or full factory suite:
npm run test:factory
```
