-- Enterprise 1.0 foundational tables for website booking + event capture.
-- Apply with Supabase migration workflow.

create table if not exists public.leads (
  id text primary key,
  type text not null default 'lead',
  name text not null,
  company text not null,
  email text not null default '',
  phone text not null default '',
  preferred_time text not null default '',
  message text not null default '',
  source text not null default 'website',
  industry text not null default 'saas',
  status text not null default 'new',
  score integer not null default 50,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_leads_updated_at on public.leads (updated_at desc);
create index if not exists idx_leads_source on public.leads (source);
create index if not exists idx_leads_industry on public.leads (industry);

create table if not exists public.events (
  id text primary key,
  type text not null,
  project_id text not null default 'platform',
  stage text not null default 'intake',
  subject text not null,
  actor text not null default 'enterprise-api',
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index if not exists idx_events_occurred_at on public.events (occurred_at desc);
create index if not exists idx_events_type on public.events (type);

alter table public.leads enable row level security;
alter table public.events enable row level security;

-- Service role bypasses RLS; policies below allow authenticated reads for internal tools.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'leads' and policyname = 'leads_read_authenticated'
  ) then
    create policy leads_read_authenticated on public.leads
      for select to authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'events' and policyname = 'events_read_authenticated'
  ) then
    create policy events_read_authenticated on public.events
      for select to authenticated
      using (true);
  end if;
end $$;
