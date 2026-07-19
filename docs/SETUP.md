# SETUP — Complete Platform Configuration

**Status:** Canonical setup reference · **App:** `apps/enterprise` (the single app)
Covers every setting needed to run Grabber Studio from zero: local dev,
Supabase, Vercel, Stripe, Resend, accounts, and verification. Written in the
lifecycle vocabulary ([DELIVERY-LIFECYCLE.md](DELIVERY-LIFECYCLE.md)).

---

## 1. Architecture at a glance

One Next.js app (`apps/enterprise`) serves every lifecycle stage:

| Surface | Route(s) | Lifecycle stages | Access |
|---|---|---|---|
| Consult (public) | `/`, `/consult` | 1 Acquire · 2 Discover | Public |
| Auth | `/login`, `/signup` | — | Public |
| Owner console | `/command-center`, `/business`, `/governance`, `/kpis`, `/ops`, `/delivery`, `/marketing`, `/clients`, `/settings` | 3–8 Analyze→Verify | Admin only |
| Client portal | `/portal` | 5 Approve · 9 Deliver · 10 Support | Signed-in (auto-scoped for clients) |

Engine: `packages/enterprise` (consulting, governance, commercial) +
`runtime/` (deterministic factory). LLM reasoning is optional — every path
has a deterministic fallback (`GRABBER_LLM=0` forces it).

Storage: the engine's file store is ephemeral on Vercel; three Supabase
tables (`engagements`, `leads`, `deposits`) are the durable mirror
(hydrate-on-read / mirror-on-write). Auth is Supabase; sessions are cookies;
roles come ONLY from `OWNER_EMAIL` + `app_metadata` (never `user_metadata`).

---

## 2. Environment variables (complete)

Set in Vercel → Project → Settings → Environment Variables (Production +
Preview), and locally in `apps/enterprise/.env.local`. The **Settings &
Monitoring** page (`/settings`) shows live configured/missing status for all
of these — it is the source of truth after deploy.

### Required — the app does not fully work without these

| Variable | Where to get it | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API (`https://<ref>.supabase.co`) | Auth + durable store |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → API keys (anon/publishable) | Public auth client |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → API keys (service_role — SECRET) | Admin ops, durable mirror |
| `SUPABASE_JWT_SECRET` | Supabase → Settings → API → JWT | Bearer-token verification |
| `OWNER_EMAIL` | your email(s), comma-separated | Admin console allowlist |
| `ANTHROPIC_API_KEY` | console.anthropic.com | Jarvis reasoning (falls back to deterministic without it) |

### Payments (Approve stage — Stripe deposit checkout)

| Variable | Where | Purpose |
|---|---|---|
| `STRIPE_SECRET_KEY` | Stripe → Developers → API keys | Checkout sessions |
| `STRIPE_WEBHOOK_SECRET` | created in §5 below | Verifies payment events |
| `NEXT_PUBLIC_APP_URL` | your deploy URL | Checkout return address |

### Email (Resend — receipts, onboarding, owner alerts)

| Variable | Where | Purpose |
|---|---|---|
| `RESEND_API_KEY` | resend.com → API Keys | All transactional email |
| `EMAIL_FROM` | verified sender, e.g. `Grabber Studio <hello@yourdomain>` | From address (Resend test sender used if unset — only delivers to your own account) |

### Recommended hardening

| Variable | Value | Purpose |
|---|---|---|
| `CORS_ORIGINS` | `https://<your-domain>` | Locks the API to your origin |
| `ENTERPRISE_API_KEY` | random secret | Service-to-service API access (`X-Enterprise-Api-Key`) |

### Optional tuning

`GRABBER_LLM_MODEL` (default `claude-sonnet-5`) · `GRABBER_LLM=0` (force
deterministic) · `GRABBER_LLM_IN_PER_MTOK` / `_OUT_PER_MTOK` (cost telemetry)
· `SUPABASE_STORAGE_BUCKET` (default `documents`) · `OPENAI_API_KEY` /
`GEMINI_API_KEY` / `ELEVENLABS_API_KEY` (future providers, visible in
Settings) · `GITHUB_TOKEN` / `VERCEL_TOKEN` (delivery automation, deferred).

---

## 3. Supabase setup (once)

### 3a. Auth
1. Authentication → Providers → Email: enabled. (Auto-confirm ON for
   friction-free client signup, or keep confirmations — both work; pending
   accounts show as `pending` in Clients & Access.)
2. Create YOUR user: Authentication → Users → Add user → your email +
   password → Auto Confirm. This plus `OWNER_EMAIL` makes you admin.

### 3b. Durable tables

Canonical source: `supabase/migrations/` (versioned in the repo). Two ways
to apply:
- **GitHub integration (recommended):** Supabase → Settings → Integrations →
  GitHub → choose `Grabber-Ai`, branch `master`. Merges then auto-apply new
  migration files.
- **Manual:** run the SQL below once in the SQL Editor (idempotent — same
  content as the migration).

```sql
-- Engagements: durable mirror of the consulting/delivery engine store
create table if not exists public.engagements (
  id text primary key,
  data jsonb not null,
  client_name text,
  status text,
  governance_stage text,
  updated_at timestamptz not null default now()
);
alter table public.engagements enable row level security;

-- Leads: Acquire-stage records (written directly by POST /api/leads)
create table if not exists public.leads (
  id text primary key,
  type text default 'lead',
  name text not null,
  company text, email text, phone text,
  preferred_time text, message text, source text, industry text,
  status text default 'new',
  score int default 50,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.leads enable row level security;

-- Deposits: durable record of paid deposits (Approve stage)
create table if not exists public.deposits (
  engagement_id text primary key,
  client_name text,
  amount numeric not null,
  currency text not null default 'usd',
  status text not null default 'paid',
  stripe_session_id text,
  paid_at timestamptz not null default now()
);
alter table public.deposits enable row level security;

-- No policies on any table: only the service role (bypasses RLS) touches
-- them. anon/authenticated get nothing — nothing is exposed to the browser.
```

Verify: `/settings` → "Durable store" tile reads **Active** (3/3 tables).

---

## 4. Accounts & roles

| Role | How created | Sees |
|---|---|---|
| **Admin (you)** | Supabase user + email listed in `OWNER_EMAIL` (or `app_metadata.role=admin`) | Full console |
| **Client** | Self-signup at `/signup` (name + phone optional) or created by you in Supabase | Only `/portal`, auto-scoped to their engagement |

Client onboarding flow: client registers → appears in **Clients & Access**
(`/clients`) → you set name/phone if missing, role `client`, and paste their
engagement id → Save → they receive the "your portal is ready" email and
their portal auto-loads their project.

Authorization rules (constitutional): roles live in `app_metadata` /
`OWNER_EMAIL` only. `user_metadata` (name, phone) is self-reported contact
info and is NEVER used for authorization.

---

## 5. Stripe (Approve stage — deposit)

1. Add `STRIPE_SECRET_KEY` + `NEXT_PUBLIC_APP_URL` (see §2).
2. Stripe Dashboard → Developers → Webhooks → **Add endpoint**:
   - URL: `https://<your-domain>/api/stripe/webhook`
   - Event: `checkout.session.completed`
   - Copy the signing secret → `STRIPE_WEBHOOK_SECRET`.
3. Flow: client portal → Proposal → **Approve & pay deposit** → Stripe
   Checkout → webhook records the deposit (Supabase), advances governance
   (`client_approval` → `deposit_received`), emails the client a receipt and
   you an alert → factory unlocks. Test card: `4242 4242 4242 4242`.

The factory NEVER builds before `deposit_received` — enforced in
`packages/enterprise/src/engagements.js` (`getFactoryHandoff`).

---

## 6. Resend (email lifecycle)

Sends (all best-effort; silent no-op without `RESEND_API_KEY`):
- **Blueprint ready** → client, when discovery produces the solution package
- **Portal ready** → client, when you link their account to an engagement
- **Deposit receipt** → client, on successful payment
- **New lead** 🔔 / **Deposit paid** 💰 → `OWNER_EMAIL`

For custom-domain sending, verify your domain in Resend and set `EMAIL_FROM`.

---

## 7. Local development

```bash
npm install                        # root workspaces (runtime + packages)
cd apps/enterprise && npm install  # app deps
cp .env.example .env.local         # fill values from §2
cd ../.. && npm run dev            # enterprise app on :3002
npm test                           # engine suites (fails loudly on any failure)
```

Offline/deterministic mode: leave `ANTHROPIC_API_KEY` unset or set
`GRABBER_LLM=0` — all consulting paths use the deterministic engine.

## 8. End-to-end verification

```bash
# from apps/enterprise — creds via env, never hardcoded
E2E_EMAIL=you@x.com E2E_PASSWORD=... npm run e2e
```
- `owner-console.spec.ts`: login + all 9 console pages render; logged-out
  access bounces to `/login`.
- `client-flow.spec.ts`: client login → scoped portal → stage stepper →
  proposal/pay-deposit button.

Manual Enterprise 1.0 gate (one real run, per
[ENTERPRISE-1.0-PLAN.md](ENTERPRISE-1.0-PLAN.md)): consult → discovery →
blueprint → proposal → client approval → payment → factory handoff → portal
delivery → support → evidence.

## 9. Operational monitoring

`/settings` (admin) is the live dashboard: Jarvis LLM online/model,
integrations configured (per env var), environment/region/build SHA, and
durable-store health (engagements + leads + deposits). If something
misbehaves, check this page first — it distinguishes "not configured" from
"broken" instantly.
