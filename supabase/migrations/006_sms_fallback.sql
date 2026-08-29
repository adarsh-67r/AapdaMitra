-- SMS fallback for no-connectivity zones.
--
-- A citizen with signal but no data cannot reach the API at all, and the
-- offline queue only helps someone who later regains it. A text message rides
-- the voice network, which survives the congestion that takes data down first.

-- Who sent the message. auth_users is keyed by email, which an SMS-only citizen
-- does not have; the phone number is the identity that arrives with the text.
-- Partial unique index rather than a unique column: every account created
-- through signup has no phone, and NULLs would otherwise need to stay distinct
-- by accident rather than by declaration.
alter table auth_users add column if not exists phone text;
create unique index if not exists auth_users_phone_key
  on auth_users (phone) where phone is not null;

-- The id the citizen app mints when it queues a report, carried on whichever
-- path reaches the server first. A report sent by SMS and then replayed by the
-- queue when data returns is one incident, and without this it becomes two —
-- which the 2 km clustering would merge but still count twice, overstating how
-- many people reported it.
alter table reports add column if not exists client_local_id text;
create unique index if not exists reports_client_local_id_key
  on reports (client_local_id) where client_local_id is not null;
