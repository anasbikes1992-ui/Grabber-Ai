-- Durable store for the Delivery Layer (see docs/SETUP.md §3b).
-- Idempotent: safe on a database where these tables already exist.
-- Service-role only: RLS is enabled with NO policies, so anon/authenticated
-- get nothing; the app's service role bypasses RLS by design.

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
  company text,
  email text,
  phone text,
  preferred_time text,
  message text,
  source text,
  industry text,
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
