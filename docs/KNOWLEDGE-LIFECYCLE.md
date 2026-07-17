# Enterprise Knowledge Lifecycle

**Status:** Frozen operating process.  
**Principle:** Knowledge is a **managed asset**, not a by-product. (Constitution §7)

---

## Framing: Business Operating Systems

Knowledge is **not** “a textile product.” It is a **Business Operating System** graph, with industries as packs:

```
knowledge/industries/{textile-wholesale,hospitality,manufacturing,…}/
```

Deepen few industries before many. See [INDUSTRY-COVERAGE.md](./INDUSTRY-COVERAGE.md).

## Graph chain (target)

```
Industry → Business Process → Pain Points → KPIs → Modules → UI Patterns
  → Database Pattern → Automation → Integrations → Deployment → Lessons Learned
```

## Lifecycle

```text
Industry Research
        ↓
Client Discovery
        ↓
Business Analysis
        ↓
Project Delivery
        ↓
Client Feedback
        ↓
Lessons Learned
        ↓
Evidence Score (Weak → Enterprise Proven)
        ↓
Knowledge Graph + Client Memory
        ↓
Playbook Update
        ↓
Module Improvement
        ↓
Blueprint Improvement
        ↓
Future Projects
```

Client Memory: [CLIENT-MEMORY.md](./CLIENT-MEMORY.md)

Nothing skips the feedback loop after delivery. “Project closed” requires a lessons artifact (even if short).

---

## Artifacts by stage

| Stage | Artifact location |
|-------|-------------------|
| Industry research | `knowledge/industries/`, `knowledge/competitors/` |
| Discovery / analysis | Engagement consulting records (enterprise domain) |
| Delivery | Factory metrics, DNA, deploy notes |
| Client feedback | Client portal tickets / engagement comments |
| Lessons learned | `knowledge/lessons-learned/` + engagement close-out |
| Knowledge graph | `knowledge/graph/` |
| Playbooks | `knowledge/playbooks/` |
| Modules | `apps/saas-starter/modules/` (+ quality level) |
| Blueprints | `apps/saas-starter/blueprints/` |

---

## Project evidence (Decision Intelligence memory)

For **each recommendation**, retain:

| Field | Purpose |
|-------|---------|
| recommendation | What was proposed |
| why | Reason |
| confidence | 0–1 |
| evidence / sources | Playbook, pattern, interview, prior projects |
| business_value / impact | Outcome claims |
| estimated_effort | Cost band |
| decision | accepted / deferred / rejected |
| outcome | post-delivery result |

After deployment, record:

- Was it accepted?  
- Was it useful?  
- Did it improve KPIs?  
- Client satisfaction signal  

**Schema seed:** `knowledge/lessons-learned/PROJECT-EVIDENCE.schema.json`  
**Runtime helper (scaffolded):** recommendations already carry provenance via Decision Intelligence; post-outcome write-back begins after first closed projects (OR-1+).

---

## Rules

1. No confidential client data in public knowledge packs.  
2. Patterns and outcomes only—never proprietary third-party code/UI.  
3. Prefer promoting lessons into graph edges and playbook questions.  
4. Module/blueprint changes from lessons require regression (Constitution §8).  
