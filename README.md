# AapdaMitra

**Real-time disaster coordination — one map for alerts, citizen reports, and the resource you send.**
Smart India Hackathon · Problem Statement **PS-05** · Disaster Management

[![Backend](https://img.shields.io/badge/backend-FastAPI-009688)](apps/backend)
[![Web](https://img.shields.io/badge/web-Next.js%2016-000000)](apps/web)
[![Citizen App](https://img.shields.io/badge/citizen%20app-Expo%20%2F%20React%20Native-4630EB)](apps/citizen-app)
[![Database](https://img.shields.io/badge/database-PostgreSQL-4169E1)](supabase/migrations)
[![Tests](https://img.shields.io/badge/backend%20tests-32%20passing-2c6742)](apps/backend/tests)

**[Live demo →](https://aapda-mitra-sih.vercel.app/)** · no signup needed — the sign-in screen offers a
one-tap demo account for both the citizen app and the authority console.

---

## The problem

During floods, cyclones and landslides, help doesn't fail for lack of caring. It fails for lack of a
shared picture.

At 12:04 a citizen is reporting waterlogging over WhatsApp to a ward officer. An IMD red alert for the
same district is live on the SACHET feed. An ambulance is idle 2 km away. All three facts are true at
the same moment, and none of the three systems can see the other two. The delay that costs lives is
not the absence of information — it is the time spent assembling it into a decision.

**AapdaMitra puts all three on one map and makes the dispatch a single click.**

## What it does

| | |
|---|---|
| **Ingests official alerts** | Polls **SACHET**, NDMA's multi-agency CAP platform, every 10 minutes. That one feed carries IMD regional warnings, Central Water Commission flood alerts, and alerts from 15+ state SDMAs — each stored with the agency that issued it and the language it was published in. |
| **Takes citizen reports** | Photo, position, severity, description — filed in under a minute. An SOS button files a critical report in one tap. Reports queue offline on the native app and replay on reconnect. |
| **Groups developing incidents** | Reports within **2 km and 30 minutes** of each other are clustered into one incident, so five calls about one collapsed bridge read as one event, not five. |
| **Dispatches the nearest unit** | A scored allocator picks the resource to send and reports how far it has to travel, guarded so two operators cannot double-dispatch the same unit. |
| **Broadcasts advisories** | Authorities push an advisory that reaches every connected citizen client. |
| **Public map, no login** | Anyone can open `/map` and see active alerts and resources across India. |

Not built, and labelled as such everywhere it appears: **SMS/IVR fallback** for no-connectivity zones.
The console carries a simulated channel panel marked `SIMULATED — no live telephony`. There is no
telephony integration behind it, and the product never claims otherwise.

## What's actually hard here

The parts that took real work, rather than the parts that demo well:

**Allocation is scored, not nearest-wins.** Distance is the base, in kilometres, discounted for a unit
that suits the report better (a critical report prefers a rescue team over a shelter — worth up to 20 km
of extra travel) and for one with more capacity to spare. Keeping every term in kilometres means the
trade-offs can be argued about in plain language instead of being opaque weights. A resource marked
available with zero remaining capacity is excluded. Dispatched units are released back to the pool when
their report is resolved — without that the available pool only ever shrinks.

**Alerts arrive in five languages, not as translations.** SACHET publishes each alert in exactly one
language — 38 English, 33 Hindi, 3 Malayalam, 1 Telugu, 1 Odia in one observed sample. They are separate
alerts, not localisations of a common record, so each is stored with its language and labelled in the UI
rather than shown as unexplained Devanagari.

**A refused location is not a dead end.** Reporting is the whole point of the citizen app, so it has to
survive the browser declining to give up a position — which is the normal case on a desktop, on an
insecure origin, and whenever a permission was dismissed once and is now remembered. The app names the
actual cause, and falls back to naming a place by hand: **7,120 towns and cities across all 594 districts**,
searchable or browsable by state → district → town. The town layer is every populated place in the GeoNames
India dump with a recorded population, each matched to a district by nearest centroid *within its own state*
so a border town cannot be filed across a state line. It matters because a district centroid is a poor
answer: Kachchh is larger than several states, and naming it puts a report tens of kilometres from the
person who filed it. Naming Bhuj does not.
A hand-placed report is stored with `location_source: manual` and the place name, so nobody downstream
mistakes a district centroid for an address.

**The homepage map is real data.** India is drawn from **589 district centroids** — the same coordinates
the ingestion uses to place district warnings — not a traced outline, and the per-belt district counts
beside each hazard figure are computed from that set rather than estimated.

## Architecture

```
apps/
  backend/       FastAPI — auth, alert ingestion, reports, resources, allocation
  web/           Next.js — homepage, public map, authority console, citizen view
  citizen-app/   Expo / React Native — offline-capable citizen reporting
supabase/
  migrations/    PostgreSQL schema and lockdown migrations
  scripts/       One-off builders for the bundled district datasets
```

| Layer | Choice | Why |
|---|---|---|
| API | FastAPI (Python) | small and explicit; every authorization decision lives in one auditable place |
| Auth | Email + password, bcrypt, JWT | no third-party provider on the core login path |
| Database | PostgreSQL | accessed only through our API; PostgREST access to app tables is revoked at the database |
| Live updates | Interval polling | predictable, with no dropped-connection edge cases mid-disaster |
| Web | Next.js 16, React 19, Leaflet, Framer Motion, Tailwind v4 | fast map rendering, scroll-driven explanation on the homepage |
| Citizen app | Expo / React Native | one codebase across iOS, Android and web |

**Design.** The interface is built as an operations instrument, not a product page: a warm paper ground,
IBM Plex, one signal red, and ruled opaque panels instead of translucent cards. Severity colour is never
the only signal — every status is labelled in text as well.

## Running it

### Backend

```bash
cd apps/backend
python -m venv .venv && .venv/Scripts/activate     # or: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env                               # DATABASE_URL, JWT_SECRET, SUPABASE_*, INGEST_SECRET
uvicorn app.main:app --reload
pytest                                             # 32 tests, no database required
```

Routes: `/auth/signup`, `/auth/login`, `/auth/request-password-reset`, `/auth/reset-password`,
`/alerts`, `/reports`, `/resources`, `/allocate`, `/internal/ingest-alerts`.

### Web

```bash
cd apps/web
npm install
npm run dev          # set NEXT_PUBLIC_API_URL — see .env.local.example
```

`/` is the homepage, or the console / citizen view once signed in. `/map` is the public map.

> Geolocation requires a secure origin. Over `http://` on a LAN address a phone browser will refuse it
> and never prompt — use `https` or the deployed site, or name a place by hand in the app.

### Citizen app

```bash
cd apps/citizen-app
npm install
npx expo start       # set EXPO_PUBLIC_API_URL — see .env.example
```

## Status

**[PROGRESS.md](PROGRESS.md)** — what is shipped, what is being hardened, and what is deliberately not
built yet, with the constraints stated honestly.
