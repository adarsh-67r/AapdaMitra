-- AapdaMitra — PS-05 schema
-- Run this in the Supabase SQL editor (or via `supabase db push`) against a fresh project.

create extension if not exists "pgcrypto";

-- Roles: 'citizen' | 'authority'. Keyed to auth.users so RLS can use auth.uid().
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('citizen', 'authority')),
  phone text,
  created_at timestamptz not null default now()
);

-- Sourced from NDMA's SACHET CAP alert feed (sachet.ndma.gov.in), which itself
-- aggregates IMD, CWC (flood), and other state/national agency alerts. Public,
-- no API key required. external_id is SACHET's own CAP `identifier`, used as
-- the upsert conflict target so re-running ingestion doesn't duplicate rows.
create table if not exists alerts (
  id uuid primary key default gen_random_uuid(),
  external_id text unique not null,
  disaster_type text not null,
  area_description text,
  severity_color text not null check (severity_color in ('green', 'yellow', 'orange', 'red')),
  severity_level text,
  warning_message text,
  source text not null default 'sachet_ndma',
  lat double precision not null,
  lng double precision not null,
  effective_start timestamptz,
  effective_end timestamptz,
  fetched_at timestamptz not null default now()
);
create index if not exists alerts_fetched_at_idx on alerts (fetched_at desc);
create index if not exists alerts_effective_end_idx on alerts (effective_end);

create table if not exists resources (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('shelter', 'rescue_team', 'supply_stock')),
  name text not null,
  lat double precision not null,
  lng double precision not null,
  capacity integer not null default 0,
  status text not null default 'available' check (status in ('available', 'full', 'dispatched')),
  created_at timestamptz not null default now()
);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  citizen_id uuid references profiles(id) on delete set null,
  lat double precision not null,
  lng double precision not null,
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  description text,
  photo_url text,
  status text not null default 'open' check (status in ('open', 'assigned', 'resolved')),
  assigned_resource_id uuid references resources(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists reports_status_idx on reports (status);
create index if not exists reports_citizen_id_idx on reports (citizen_id);

-- Row Level Security
alter table profiles enable row level security;
alter table alerts enable row level security;
alter table resources enable row level security;
alter table reports enable row level security;

-- alerts & resources: readable by anyone (anon + authenticated), including unauthenticated
-- citizen-app browsing before login. Writes go through the service role only (ingestion
-- job, seed script, allocator route), never from a client.
create policy "alerts_public_read" on alerts for select using (true);
create policy "resources_public_read" on resources for select using (true);

-- reports: anyone can insert (citizen app allows anonymous reporting); citizens can read
-- only their own reports, authorities can read all.
create policy "reports_public_insert" on reports for insert with check (true);
create policy "reports_own_read" on reports for select using (
  citizen_id = auth.uid()
  or exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'authority')
);
create policy "reports_authority_update" on reports for update using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'authority')
);

-- profiles: a user can read/insert/update their own profile row.
create policy "profiles_own_read" on profiles for select using (id = auth.uid());
create policy "profiles_own_insert" on profiles for insert with check (id = auth.uid());
create policy "profiles_own_update" on profiles for update using (id = auth.uid());

-- Realtime: broadcast changes on reports/alerts/resources to subscribed clients.
alter publication supabase_realtime add table reports;
alter publication supabase_realtime add table alerts;
alter publication supabase_realtime add table resources;

-- Table-level grants. RLS policies alone are not sufficient — Postgres also
-- checks the underlying GRANT for the role, and with "Automatically expose
-- new tables" left off (the recommended setting) these are not created by
-- default. anon = unauthenticated clients (citizen app before login,
-- dashboard's public reads). authenticated = any logged-in user; RLS above
-- still narrows what each role can actually see/change per-row.
grant usage on schema public to anon, authenticated;

grant select on alerts to anon, authenticated;
grant select on resources to anon, authenticated;

grant select, insert on reports to anon, authenticated;
grant update on reports to authenticated;

grant select, insert, update on profiles to authenticated;
-- anon needs SELECT on profiles too: the reports RLS policy's subquery
-- checks profiles.role internally even for anonymous requests. RLS still
-- returns zero profile rows to anon (profiles_own_read requires
-- id = auth.uid()) — this grant only unblocks that internal check.
grant select on profiles to anon;

-- service_role normally bypasses RLS and privilege checks by default in
-- Supabase, but with "Automatically expose new tables" off at project
-- creation, default grants were skipped for every role on this project,
-- service_role included. Without this, the service-role client used by the
-- ingestion and allocator routes gets "permission denied" instead of
-- bypassing RLS as expected.
grant all on alerts, resources, reports, profiles to service_role;

-- Storage: bucket for citizen report photos. Public read (photos need to be
-- viewable on the authority dashboard without a signed URL); insert open to
-- anyone since Storage RLS is separate from the `reports` table's own RLS.
insert into storage.buckets (id, name, public)
values ('report-photos', 'report-photos', true)
on conflict (id) do nothing;

create policy "report_photos_public_read" on storage.objects
  for select using (bucket_id = 'report-photos');
create policy "report_photos_insert" on storage.objects
  for insert with check (bucket_id = 'report-photos');

-- Authority manual controls: resolve/reassign reports, add/edit resources,
-- and broadcast custom advisories (alongside the automated SACHET feed).
-- external_id gets a default so authority-authored alerts don't need to
-- fabricate one client-side (SACHET-sourced rows still set their own, from
-- the CAP identifier, for upsert dedup).
alter table alerts alter column external_id set default gen_random_uuid()::text;

grant insert, update on resources to authenticated;
create policy "resources_authority_write" on resources for insert with check (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'authority')
);
create policy "resources_authority_update" on resources for update using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'authority')
);

grant insert on alerts to authenticated;
create policy "alerts_authority_insert" on alerts for insert with check (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'authority')
);
