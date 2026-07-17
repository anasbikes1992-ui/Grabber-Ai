# /knowledge — The Knowledge Engine

Structure, graph, retrieval contract, and enrichment loop are specified in
[docs/03-KNOWLEDGE-ENGINE.md](../docs/03-KNOWLEDGE-ENGINE.md).

**Jarvis consulting** (patterns only, never proprietary copy): [docs/JARVIS-CONSULTANT.md](../docs/JARVIS-CONSULTANT.md)

| Path | Role |
|------|------|
| `industries/` | Industry packs (e.g. wholesale-distribution / textile) |
| `playbooks/` | Discovery questions, modules, risks |
| `competitors/` | Benchmark **pattern cards** (ERPNext, Odoo, …) |
| `patterns/` | Warehouse, purchasing, inventory, … |
| `ui-patterns/` | UX conventions |
| `lessons-learned/` | Continuous improvement from closed projects |
| `commercial/` | Deliverables catalog |

Every entry: one home (Rule 1), required frontmatter (`id`, `type`,
`industry`, `pattern`, `status`, `source_project`, `last_validated`), and
graph edges. Every closed project must merge a curated learning report here
before it counts as done.
