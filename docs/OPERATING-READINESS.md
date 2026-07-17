# Operating Readiness Gates

**Architecture is strategically complete.** Maturity = gates with evidence, not version numbers.

Constitution: [CONSTITUTION.md](./CONSTITUTION.md)

---

## Gates

| Gate | Meaning | Exit evidence |
|------|---------|----------------|
| **OR-1** | Internal dogfooding complete | ≥4 verticals full lifecycle; scorecards; no Core bypass |
| **OR-2** | Repeatable across simulated industries | ≥10 runs; quality variance within band; reuse targets |
| **OR-3** | Operational reliability validated | Stress/reliability metrics; low intervention rate; logging |
| **CR-1** | First real customer engagements | 3–5 clients through system; no Jarvis bypass |
| **CR-2** | Commercially repeatable business | 20+ projects; pattern mining; stable conversion |
| **ER-1** | Enterprise-scale operations | Multi-team ops, SLAs, production infra, ER playbooks |

---

## Current position (honest)

| Layer | Status |
|-------|--------|
| Vision | ✅ Frozen |
| Product Model | ✅ Frozen |
| Constitution | ✅ Frozen |
| Grabber Core | ✅ Frozen |
| Product Factory | ✅ Frozen (features via modules/blueprints only) |
| Decision Intelligence | 🟡 Ready for operational validation |
| Business OS | 🟡 Ready for operational validation |
| Jarvis Consultant | 🟡 Ready for operational validation |
| Commercial Engine | 🟡 Ready for operational validation |
| Client Portal | 🟡 Ready for operational validation |
| Continuous Improvement | 🟡 Begins after first completed projects |
| **Active gate** | **OR-1** + Launch Phase 1 |
| **Enterprise 1.0** | Not achieved until **one real full-lifecycle client** ([ENTERPRISE-1.0.md](./ENTERPRISE-1.0.md)) |

---

## OR-1 protocol

See [DOGFOOD-PROTOCOL.md](./DOGFOOD-PROTOCOL.md).

Mandatory path (nothing skips):

```
Lead → Discovery → Analysis → Commercial → Approval
  → DNA → Factory → Deploy → Support → Lessons
```

---

## Three workstreams (post-architecture)

1. **Public launch** — website → Jarvis funnel ([LAUNCH.md](./LAUNCH.md))  
2. **Operational validation** — OR-1 dogfood → real prospects  
3. **Production infrastructure** — Supabase, auth, storage, monitoring, CI/CD, backups, secrets, staging/prod  

Detail: [ENTERPRISE-1.0.md](./ENTERPRISE-1.0.md)

---

## Agent / engineering rule

> No feature is added because it is interesting. Every feature must be justified by evidence from real operations, improve a measurable business outcome, and strengthen the consulting-to-delivery lifecycle.

Track B only unless EDR for Core. No new conceptual layers.  
Living assets may improve freely with evidence; frozen architecture may not.
