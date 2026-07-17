# Grabber AI Studio — Launch Architecture

**Phase:** Launch Phase 1 — **Customer Acquisition**  
**Architectural endpoint:** reached. Next = prove lifecycle ([ENTERPRISE-1.0.md](./ENTERPRISE-1.0.md)).  
**Not now:** new architectural layers, Core changes, or launch-blocking 3D polish.

---

## Maturity (honest)

| Layer | State |
|-------|--------|
| Grabber Core | ✅ Engine |
| Product Factory | ✅ Manufacturing |
| Module Registry | ✅ |
| Blueprint Engine | ✅ |
| Business OS | ✅ Scaffold (deepen via consulting) |
| Enterprise app | ✅ Scaffold |
| Jarvis OS UI | 🟡 Experience layer |
| Landing website | 🟡 **Phase 1 priority** |
| Customer journey | 🟡 **Phase 1 priority** |
| Production infrastructure | 🟡 Later |

Backend/architecture is **ahead** of customer-facing experience. Launch work closes that gap.

---

## Public journey (what the world sees)

```
Internet
  → Landing website (grabber.ai / localhost:3003)
  → AI Consultant entry ("Describe your business")
  → Discovery interview (Jarvis consulting)
  → Business OS / commercial package
  → Approval + deposit
  → Product Factory
  → Deployment
  → Client Portal
```

Customers **never** see prompts, DNA JSON, or Core.

Canonical consulting model: [JARVIS-CONSULTANT.md](./JARVIS-CONSULTANT.md)

---

## Monorepo apps (target)

```
apps/
  website/       # Landing, marketing, pricing, portfolio, consult entry  :3003
  jarvis-os/     # Premium command center / experience                     :3001
  enterprise/    # Business OS, portal, commercial, consulting API         :3002
  saas-starter/  # Product Factory host                                    :3000
  admin/         # Internal management (later)
```

Empty dirs `business-os/`, `client-portal/`, `marketing-intel/` are **superseded** by `enterprise/` surfaces — do not rebuild as separate apps without a metric.

---

## Launch phases

### Phase 1 — Customer Acquisition (NOW)

- Landing website  
- AI consultation entry  
- Discovery workflow (consulting engine)  

### Phase 2 — Business Operations

- Business OS depth  
- Commercial approvals  
- Proposal quality  

### Phase 3 — Product Delivery

- Factory path for paid work  
- Client portal  
- Deployment pipeline  

### Phase 4 — Premium Experience

- Jarvis 3D factory visualization (R3F / Drei / Motion) — **visualizes**, never orchestrates  
- Command palette polish  
- Voice only if metrics justify  

---

## Local run order

| Terminal | Command | URL |
|----------|---------|-----|
| 1 | `supabase start` (when wired) | local Supabase |
| 2 | `npm install` (repo root) | — |
| 3 | `npm run saas:dev` | http://127.0.0.1:3000 |
| 4 | `npm run jarvis:dev` | http://127.0.0.1:3001 |
| 5 | `npm run enterprise:dev` | http://127.0.0.1:3002 |
| 6 | `npm run website:dev` | http://127.0.0.1:3003 |

**Phase 1 minimum:** `enterprise:dev` + `website:dev` (consult API + acquisition).

---

## Production (target hostnames)

| App | Host |
|-----|------|
| Website | grabber.ai |
| Jarvis | jarvis.grabber.ai |
| Enterprise | enterprise.grabber.ai |
| Factory | factory.grabber.ai |
| Admin | admin.grabber.ai |

Shared backend later: Supabase (Postgres, Auth, Storage). Deploy apps independently (e.g. Vercel).

---

## What not to do before Phase 1 is solid

- Add Core architecture  
- Expand factory for novelty  
- Block launch on 3D / voice  
- Multiple competing marketing apps  

---

## Phase 1 Definition of Done (acquisition surface)

- [ ] Public landing tells the company story in plain language  
- [ ] Visitor can describe their **business** and enter discovery  
- [ ] No prompts or internal tools exposed  
- [ ] Path reaches consulting package path (enterprise `/consult` or API)  
- [ ] Pricing / industries / portfolio sections exist (content can iterate)  
- [ ] SEO basics (titles, meta, semantic sections)  

## Enterprise 1.0 (true production milestone)

Not “website shipped.” See [ENTERPRISE-1.0.md](./ENTERPRISE-1.0.md):

Website lead → Jarvis discovery → commercial → governance → DNA → factory → accept → deploy → support → lessons.

## Three concurrent workstreams

1. Public launch (this doc)  
2. Operational validation (OR-1 → real prospects)  
3. Production infrastructure (Supabase, auth, storage, monitoring, CI/CD, backups, secrets, staging/prod)  
