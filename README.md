# AapdaMitra

**Real-time disaster early-warning and resource coordination — built for PS-05.**

[![Backend](https://img.shields.io/badge/backend-FastAPI-009688)](apps/backend)
[![Dashboard](https://img.shields.io/badge/dashboard-Next.js-000000)](apps/web)
[![Citizen App](https://img.shields.io/badge/citizen%20app-Expo%20%2F%20React%20Native-4630EB)](apps/citizen-app)
[![Database](https://img.shields.io/badge/database-PostgreSQL-4169E1)](supabase/migrations)

When disaster strikes, the gap that costs lives isn't a lack of information — it's the seconds spent stitching together alerts, ground reports, and available resources into a decision. AapdaMitra closes that gap: it pulls live disaster alerts, lets citizens report what they're seeing in real time with a photo and exact location, and gives response authorities a single live map to see everything at once and dispatch the nearest available resource in one click.

## What it does

- **Live alert ingestion** — continuously pulls and de-duplicates disaster alerts from the SACHET early-warning feed, geocoded and ready to plot.
- **Citizen reporting** — anyone can report an incident in seconds: photo, GPS location, description — no login friction, no app-store-only gatekeeping.
- **One map, both layers** — authorities see citizen reports and available resources (ambulances, shelters, rescue teams) on the same live map, refreshed continuously.
- **Nearest-available dispatch** — a haversine-distance allocator picks the closest available resource to a report and dispatches it in one action, not a spreadsheet lookup.
- **Broadcast advisories** — authorities can push a public advisory that shows up instantly across every connected citizen client.
- **Shelter & resource visibility** — citizens can see nearby shelters and live alerts without needing to know who to call.

Built to work under real disaster-response conditions: fast to load, resilient to flaky connections, and legible at a glance — the dashboard is designed to be read in seconds by someone coordinating a response, not studied like a report.

## How it's built

A from-scratch backend (no vendor auth/API lock-in) behind two purpose-built frontends: a command-center dashboard for authorities, and a lightweight mobile app for citizens.

```
apps/
  backend/       FastAPI service — auth, alerts, reports, resources, allocation
  dashboard/     Next.js authority dashboard (live map, allocator, resource & broadcast tools)
  citizen-app/   Expo/React Native citizen app (report incidents, view alerts/shelters)
supabase/
  migrations/    Schema + security migrations for the PostgreSQL database
```

| Layer | Choice | Why |
|---|---|---|
| API | FastAPI (Python) | small, explicit, every authorization decision lives in one auditable place |
| Auth | Email + password, bcrypt, JWT | no dependency on a third-party auth provider for the core login path |
| Database | PostgreSQL | managed instance, accessed only through the API — row-level security enforced at the database layer as defense in depth |
| Live updates | Interval polling | simple, predictable, no dropped-connection edge cases mid-disaster |
| Dashboard | Next.js + React + Leaflet | fast map rendering, server-rendered shell |
| Citizen app | Expo + React Native | one codebase, ships to iOS, Android, and web |

## Getting started

### Backend

```bash
cd apps/backend
python -m venv .venv && .venv/Scripts/activate   # or source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in DATABASE_URL, JWT_SECRET, SUPABASE_*, RESEND_API_KEY, INGEST_SECRET
uvicorn app.main:app --reload
```

Run the test suite with `pytest` — the allocator, alert-parsing, and auth-core modules are unit-tested and run without a live database.

Core routes: `/auth/signup`, `/auth/login`, `/auth/request-password-reset`, `/auth/reset-password`, `/alerts`, `/reports`, `/resources`, `/allocate`, `/internal/ingest-alerts`.

### Dashboard (authority)

```bash
cd apps/web
npm install
npm run dev
```

Set `NEXT_PUBLIC_API_URL` to your running backend (see `.env.local.example`).

### Citizen app

```bash
cd apps/citizen-app
npm install
npx expo start
```

Set `EXPO_PUBLIC_API_URL` to your running backend (see `.env.example`).

## Project status

See [PROGRESS.md](PROGRESS.md) for what's shipped, what's actively being hardened, and what's next.
