-- apps/backend replaces Supabase Auth/PostgREST; RLS (which depends on
-- Supabase Auth's auth.uid()) is disabled since authorization now lives in
-- FastAPI dependencies instead.

create table if not exists auth_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  role text not null check (role in ('citizen', 'authority')),
  reset_token text,
  reset_token_expires timestamptz,
  created_at timestamptz not null default now()
);

alter table reports drop constraint if exists reports_citizen_id_fkey;
alter table reports add constraint reports_citizen_id_fkey
  foreign key (citizen_id) references auth_users(id) on delete set null;

alter table alerts disable row level security;
alter table resources disable row level security;
alter table reports disable row level security;
alter table profiles disable row level security;
