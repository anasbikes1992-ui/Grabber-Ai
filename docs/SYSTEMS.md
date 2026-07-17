# SYSTEMS.md — Operational Ownership Map

**Not architecture. Ownership.** Who owns each system, what it does, what flows in and out.
Update when ownership or interfaces change — nothing else belongs here.

Roles: Owner · Consultant · Developer · Reviewer · Finance (per [EDR-008](../decisions/EDR-008-execution-quality-milestone.md)).

---

## Product Systems

### Website
| | |
|---|---|
| **Owner** | Owner |
| **Purpose** | Acquire leads; public credibility |
| **Inputs** | Visitor traffic, booking form submissions |
| **Outputs** | Leads → Business OS, consultations booked |
| **Dependencies** | Supabase (leads), Calendar, Notification service |
| **Location** | `apps/website` |

### Jarvis (Consulting Engine)
| | |
|---|---|
| **Owner** | Consultant |
| **Purpose** | Discovery interviews → analysis → recommendations → executive report |
| **Inputs** | Lead context, conversation, business documents |
| **Outputs** | Business analysis, gaps, roadmap, investment/ROI estimate, executive package |
| **Dependencies** | LLM (`packages/enterprise/src/llm.js`), verifier, Knowledge Engine, Supabase |
| **Location** | `packages/enterprise`, `apps/website /consult` |

### Business OS (internal CRM)
| | |
|---|---|
| **Owner** | Owner |
| **Purpose** | Manage engagements end-to-end |
| **Inputs** | Leads, consultations, proposals, approvals, payments |
| **Outputs** | Projects, invoices, engagement status, commercial documents |
| **Dependencies** | Supabase, Storage, Notification service, Payments |
| **Location** | `apps/business-os` |

### Client Portal
| | |
|---|---|
| **Owner** | Consultant |
| **Purpose** | Client transparency: status, documents, approvals |
| **Inputs** | Project state, deliverables, invoices |
| **Outputs** | Client approvals, feedback, support requests |
| **Dependencies** | Supabase (RLS), Storage, Auth |
| **Location** | `apps/client-portal` |

### Developer Portal / Dashboard
| | |
|---|---|
| **Owner** | Developer |
| **Purpose** | Execute projects: task graph, verification status, deployments |
| **Inputs** | Task graphs from Execution Orchestrator |
| **Outputs** | Completed tasks, verification results, deploy events |
| **Dependencies** | Execution Orchestrator, Factory, CI/CD |
| **Location** | `apps/jarvis-os` (current UI) |

---

## Platform Systems

### Execution Orchestrator
| | |
|---|---|
| **Owner** | Developer |
| **Purpose** | Transform approved business intent into executable, gated delivery plans ([EDR-010](../decisions/EDR-010-execution-orchestrator.md)) |
| **Inputs** | Approved consultation + Business DNA |
| **Outputs** | Project plan, task graph, assignments, gate status |
| **Dependencies** | Runtime (IEP/execution-engine), Factory, Quality Gates |
| **Location** | `runtime/src/orchestration` |

### Factory
| | |
|---|---|
| **Owner** | Developer |
| **Purpose** | Deterministic artifact/product generation from Project DNA |
| **Inputs** | Task graph, templates, module library |
| **Outputs** | Verified build artifacts (never direct-to-production) |
| **Dependencies** | Execution Orchestrator, templates, verification pipeline |
| **Location** | `runtime/src/factory`, `templates/`, `apps/saas-starter` (prototype) |

### Evidence Engine
| | |
|---|---|
| **Owner** | Consultant |
| **Purpose** | Capture facts from every interaction (accepted/rejected, objections, outcomes) |
| **Inputs** | Consultations, proposals, deliveries, client feedback |
| **Outputs** | Evidence records with strength scores |
| **Dependencies** | Supabase, Knowledge Engine |
| **Location** | `runtime/` + `knowledge/` |

### Knowledge Engine
| | |
|---|---|
| **Owner** | Owner (curation authority per [EDR-009](../decisions/EDR-009-knowledge-engine.md)) |
| **Purpose** | Turn evidence into playbooks, modules, blueprints, rules |
| **Inputs** | Evidence, lessons (success **and** failure), completed projects |
| **Outputs** | Improved recommendations, reusable assets |
| **Dependencies** | Evidence Engine, Knowledge Graph |
| **Location** | `knowledge/`, `runtime/` |

### Connectors
| | |
|---|---|
| **Owner** | Developer |
| **Purpose** | Thin adapters: auth, transport, webhooks — no business logic |
| **Inputs/Outputs** | Per manifest (GitHub, Stripe, Supabase, WhatsApp, Calendar…) |
| **Location** | `connectors/` |

---

## Infrastructure Systems

| System | Owner | Notes |
|---|---|---|
| **Supabase (Postgres + RLS + Realtime)** | Developer | Reference persistence implementation; schema at `runtime/src/storage/SCHEMA.md` |
| **Supabase Storage** | Developer | All generated documents; never filesystem |
| **Auth** | Developer | Magic link + Google/Microsoft/GitHub; role enforcement in middleware + RLS |
| **Monitoring / error tracking** | Developer | Required before Stage 14 (real clients) |
| **CI/CD (Vercel)** | Developer | `main` → production, `develop` → preview |

### Production services checklist (infrastructure, not strategy)

Required before/alongside real clients — build or buy, never architect:

- [ ] Feature flags
- [ ] Audit logs
- [ ] Notification service (email / SMS / WhatsApp)
- [ ] Background job queue
- [ ] File versioning
- [ ] Search
- [ ] Analytics / event tracking
- [ ] Secrets management
- [ ] Error monitoring
- [ ] Backup and restore
- [ ] Rate limiting
- [ ] API versioning

---

## Future repository split (documented, not executed)

Everything lives in one monorepo today. **No split until the monorepo hurts.**
When it does, the boundaries are:

```
grabber-ai-core        ← runtime, SDKs, shared packages
grabber-website        ← apps/website
grabber-business-os    ← apps/business-os
grabber-client-portal  ← apps/client-portal
grabber-developer      ← apps/jarvis-os (developer dashboard)
grabber-runtime        ← runtime/
grabber-knowledge      ← knowledge/ + evidence
grabber-connectors     ← connectors/
grabber-factory        ← factory + templates + reference-projects
```
