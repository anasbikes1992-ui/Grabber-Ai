# Client Memory

**Status:** Architected (living asset).  
**Constitution:** structured company memory after Evidence—not raw chat history.

---

## Purpose

When a client returns, Jarvis knows them by reading **structured memory**, not by replaying unstructured transcripts.

---

## Record shape (per client / engagement lineage)

```
Business Profile
Interview summaries
Problems & pain points
Decisions (accepted / deferred / rejected recommendations)
Requirements
Approvals
Architecture choices
Modules used
Lessons
ROI / measured outcomes
Feedback
```

---

## Rules

1. No confidential dump into public knowledge packs.  
2. Memory feeds **returning-client** consulting; anonymized extracts may feed industry knowledge after review.  
3. Memory is written on stage transitions and close-out—not invented by the LLM.  
4. Evidence Engine outcomes link into Memory (`recommendation_id` → decision → outcome).

---

## Storage (now → later)

| Phase | Store |
|-------|--------|
| Now | File-backed under `.grabber/enterprise/memory/` (or engagement fields) |
| Later | Postgres / Supabase when multi-user ops require it |

Implementation tracks Execution Roadmap (skeleton with Evidence Engine A2; full CRM-grade later).
