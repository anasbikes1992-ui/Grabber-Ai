# Module Quality Levels

Not every module is equally mature. Assembly and commercial commitments must respect quality levels.

| Level | Meaning | May use in |
|-------|---------|------------|
| **Experimental** | Internal only | Lab / R&D |
| **Beta** | Dogfooded (OR) | Internal demos, non-binding proposals |
| **Stable** | Used in real projects | Client delivery with stated risk |
| **Enterprise** | Proven repeatedly + regression coverage | Default for commercial DNA |

---

## Rules

1. Blueprints should declare **minimum module quality** (default: Stable for paid work).  
2. Promoting a module requires: tests, docs, and at least one closed-project evidence link.  
3. Experimental modules never appear as “Essential” in client Decision Intelligence without explicit risk acceptance.  
4. Quality level lives in module `builder.json` / registry metadata when available; until then track in PR notes and registry summary.

---

## Promotion checklist

- [ ] Acceptance tests pass  
- [ ] Documented README  
- [ ] Used in ≥1 golden or real assembly  
- [ ] No open P0 defects  
- [ ] Regression suite includes module  
- [ ] Lessons/evidence recorded if from a client project  
