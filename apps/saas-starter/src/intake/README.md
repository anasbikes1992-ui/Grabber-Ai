# Intake pipeline (Sprint 3)

**Produces Project DNA**, not forms.

```
Client → Business Discovery → Requirements → Features → Modules
  → Domain → Architecture → Project DNA → Cost Estimate → Review
  → (approve + ready_for_build) → Submit to Grabber Core
```

| Path | Role |
|------|------|
| `parser.ts` | Conversation / uploads → structured input |
| `domain.ts` | Domain identification + module boosts |
| `dna.ts` | Rich DNA + Core-compatible envelope |
| `validators.ts` | Confidence + completeness scoring |
| `estimators.ts` | Cost / duration estimate for review |
| `pipeline.ts` | Canonical stage runner |
| `submit.ts` | Gate: human approve + ready_for_build |

## Quality KPIs

- DNA Completeness %
- DNA Confidence %
- Clarifications required
- Builder warnings
- Validation errors

Core submit is **blocked** when `ready_for_build === false`.
