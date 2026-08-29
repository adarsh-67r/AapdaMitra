-- Hospitals, police stations and fire stations, so the citizen app can draw
-- what is already near someone under the shelter map.
--
-- Reference data from OpenStreetMap (ODbL), not part of any incident: nothing
-- writes here at runtime, and the loader in supabase/scripts/load-facilities.js
-- fills it from the same cell files the web map is served from.
--
-- No PostGIS. A bounding box over 58,232 rows is a range scan on lat with an
-- lng filter over the handful that survive it, which is well under a
-- millisecond; a geometry extension is a great deal of machinery to carry for
-- one query that never grows more complex than a rectangle.

create table if not exists facilities (
  id bigserial primary key,
  -- 0 hospital, 1 police, 2 fire. Matches KIND_BY_NAME in app/facilities.py and
  -- the index the built cell files store.
  kind smallint not null check (kind between 0 and 2),
  lat double precision not null,
  lng double precision not null,
  name text not null
);

create index if not exists facilities_lat_idx on facilities (lat);

-- Read-only reference data, reached only through the backend's own role, like
-- every other table here. 002_lockdown_postgrest.sql revoked the anon and
-- authenticated roles; nothing below re-grants them.
alter table facilities enable row level security;
