# AapdaMitra

Real-time disaster early-warning and resource coordination platform (PS-05).

AapdaMitra ingests live disaster alerts (SACHET), lets citizens report incidents with photos and location, and gives disaster-response authorities a live map to review reports, allocate the nearest available resource, and broadcast advisories — all backed by a custom FastAPI service (no Supabase Auth/Realtime dependency).


## Architecture

```
apps/
  backend/       FastAPI service — auth, alerts, reports, resources, allocation
  dashboard/     Next.js authority dashboard (map, allocator, resource/broadcast tools)
  citizen-app/   Expo/React Native citizen app (report incidents, view alerts/shelters)
supabase/
  migrations/    Schema + security migrations for the Postgres database
```

- **Database:** Postgres, hosted on Supabase (used purely as a managed Postgres + object storage instance — no Supabase Auth, no PostgREST access, no Realtime). The backend connects with a role that bypasses RLS; RLS is enabled on all tables specifically to keep Supabase's own auto-generated REST API from exposing data directly.
- **Auth:** email + password, bcrypt-hashed, JWT bearer tokens (7-day expiry). Two roles: `citizen` and `authority`.
- **Realtime:** replaced with interval polling (12s) from both frontends — no websockets.
- **File storage:** citizen report photos are uploaded through the backend, which proxies them to Supabase Storage.
- **Alert ingestion:** a scheduled job (external cron, every 10 minutes) hits an authenticated backend endpoint that pulls and upserts alerts from the SACHET feed.

## Backend

```bash
cd apps/backend
python -m venv .venv && .venv/Scripts/activate   # or source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in DATABASE_URL, JWT_SECRET, SUPABASE_*, RESEND_API_KEY, INGEST_SECRET
uvicorn app.main:app --reload
```

Tests: `pytest` (allocator, SACHET parsing, and auth-core modules are TDD'd and run without a live DB).

Key routes: `/auth/signup`, `/auth/login`, `/auth/request-password-reset`, `/auth/reset-password`, `/alerts`, `/reports`, `/resources`, `/allocate`, `/internal/ingest-alerts`.

## Dashboard (authority)

```bash
cd apps/dashboard
npm install
npm run dev
```

Requires `NEXT_PUBLIC_API_URL` pointing at the backend (see `.env.local.example`).

## Citizen app

```bash
cd apps/citizen-app
npm install
npx expo start
```

Requires `EXPO_PUBLIC_API_URL` pointing at the backend.

## Status

See [PROGRESS.md](PROGRESS.md) for what's built, what's in flight, and known gaps.
