-- Task: lock down PostgREST direct access now that FastAPI is the sole
-- authorization boundary. Migration 001 disabled RLS on these tables but
-- left the original anon/authenticated GRANTs (from schema.sql) in place,
-- which meant PostgREST — still live, still accepting the public anon key —
-- could read and write these tables directly, bypassing FastAPI entirely.
--
-- The backend's DATABASE_URL connects as the `postgres` role, which has
-- BYPASSRLS on Supabase, so re-enabling RLS below does not affect FastAPI.
-- It only blocks the PostgREST path (RLS on + zero policies = deny-all for
-- non-bypassing roles, which is what we want instead of a stale
-- auth.uid()-based policy).

revoke all on alerts, resources, reports, profiles from anon, authenticated;

drop policy if exists "alerts_public_read" on alerts;
drop policy if exists "alerts_authority_insert" on alerts;
drop policy if exists "resources_public_read" on resources;
drop policy if exists "resources_authority_write" on resources;
drop policy if exists "resources_authority_update" on resources;
drop policy if exists "reports_public_insert" on reports;
drop policy if exists "reports_own_read" on reports;
drop policy if exists "reports_authority_update" on reports;
drop policy if exists "profiles_own_read" on profiles;
drop policy if exists "profiles_own_insert" on profiles;
drop policy if exists "profiles_own_update" on profiles;

alter table alerts enable row level security;
alter table resources enable row level security;
alter table reports enable row level security;
alter table profiles enable row level security;
