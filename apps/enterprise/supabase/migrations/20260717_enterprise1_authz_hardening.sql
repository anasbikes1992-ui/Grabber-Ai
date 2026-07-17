-- Enterprise 1.0 auth hardening: replace permissive authenticated-read policies
-- with role-scoped policies based on JWT role claims.

-- Notes:
-- 1) Supabase service role bypasses RLS, so backend jobs continue to work.
-- 2) JWT role is resolved from app_metadata.role first, then top-level role.

alter table public.leads enable row level security;
alter table public.events enable row level security;

do $$
begin
  -- Remove prior broad policies if they exist.
  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'leads' and policyname = 'leads_read_authenticated'
  ) then
    drop policy leads_read_authenticated on public.leads;
  end if;

  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'events' and policyname = 'events_read_authenticated'
  ) then
    drop policy events_read_authenticated on public.events;
  end if;

  -- Leads: read for viewer/operator/admin-style roles.
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'leads' and policyname = 'leads_select_role_scoped'
  ) then
    create policy leads_select_role_scoped on public.leads
      for select to authenticated
      using (
        coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() ->> 'role', '')
          in ('viewer', 'operator', 'admin', 'enterprise_admin', 'sales_ops', 'ops_admin')
      );
  end if;

  -- Leads writes are restricted to operator/admin-style roles.
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'leads' and policyname = 'leads_write_role_scoped'
  ) then
    create policy leads_write_role_scoped on public.leads
      for all to authenticated
      using (
        coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() ->> 'role', '')
          in ('operator', 'admin', 'enterprise_admin', 'sales_ops', 'ops_admin')
      )
      with check (
        coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() ->> 'role', '')
          in ('operator', 'admin', 'enterprise_admin', 'sales_ops', 'ops_admin')
      );
  end if;

  -- Events: read for analytics and admin roles.
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'events' and policyname = 'events_select_role_scoped'
  ) then
    create policy events_select_role_scoped on public.events
      for select to authenticated
      using (
        coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() ->> 'role', '')
          in ('viewer', 'operator', 'admin', 'enterprise_admin', 'analyst', 'delivery_ops', 'ops_admin')
      );
  end if;

  -- Events writes are restricted to delivery/admin-style roles.
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'events' and policyname = 'events_write_role_scoped'
  ) then
    create policy events_write_role_scoped on public.events
      for all to authenticated
      using (
        coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() ->> 'role', '')
          in ('operator', 'admin', 'enterprise_admin', 'delivery_ops', 'ops_admin')
      )
      with check (
        coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() ->> 'role', '')
          in ('operator', 'admin', 'enterprise_admin', 'delivery_ops', 'ops_admin')
      );
  end if;
end $$;
