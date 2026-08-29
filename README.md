# AapdaMitra

**Real-time disaster coordination — one map for alerts, citizen reports, and the resource you send.**
Smart India Hackathon · Problem Statement **PS-05** · Disaster Management

[![Backend](https://img.shields.io/badge/backend-FastAPI-009688)](apps/backend)
[![Web](https://img.shields.io/badge/web-Next.js%2016-000000)](apps/web)
[![Citizen App](https://img.shields.io/badge/citizen%20app-Expo%20%2F%20React%20Native-4630EB)](apps/citizen-app)
[![Database](https://img.shields.io/badge/database-PostgreSQL-4169E1)](supabase/migrations)
[![Tests](https://img.shields.io/badge/tests-63%20backend%20%2B%2051%20app-2c6742)](apps/backend/tests)

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
| **Shows what is already there** | An optional layer draws **58,232 real hospitals, police stations and fire stations** from OpenStreetMap — on the console, the public map and the citizen app — so whoever is deciding can see the facilities near an incident that this system does not own. |
| **Works without data** | A citizen with signal but no data can file a report by **SMS**. The app composes the message and opens the messaging app; the backend parses it, dedupes it against the offline queue, and files the same report the API would have. |
| **Speaks 14 languages** | The citizen app and the citizen web view run in **English plus 13 Indian languages across 10 scripts**. Official alert text is never translated — see below. |
| **Public map, no login** | Anyone can open `/map` and see active alerts and resources across India. |

Not built, and labelled as such everywhere it appears: **IVR**. The console carries a simulated
channel panel marked `SIMULATED — no live telephony`. There is no voice integration behind it, and the
product never claims otherwise. The SMS half *is* built and live — see below for exactly how far it
goes.

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

**The facility layer is filtered to India by polygon, not by box.** Hospitals cannot be pulled from
Overpass for the whole country in one request — it times out — so they come back in six bounding-box
tiles, and a box drawn around India contains parts of six other countries. The first build had a
hospital in Xinjiang at the top of the file. Every facility is now tested for containment against the
same GADM district polygons the rest of the system uses, which drops 7,591 foreign points.

Delivering it is its own problem. The layer only draws at zoom 11 and closer, where the view is a
fraction of a degree, so shipping all 58,232 rows to answer a question about one neighbourhood is
waste that a phone pays for. On the web it is cut into **331 one-degree cells** — median 4 KB, largest
79 KB — behind a 2.6 KB manifest of which cells exist, and a view fetches the one to four it covers.
The app asks `GET /facilities` for a bounding box instead, and the server refuses a box wider than a
degree: its own copy of the zoom rule, so a client that stops respecting it cannot ask for everything.
Either way the map draws at most 400 markers and says how many it is not showing rather than quietly
hiding them.

**SMS carries a report where data cannot.** A citizen with signal but no data cannot reach the API at
all, and the offline queue only helps someone who later regains it — a text rides the voice network,
which survives the congestion that takes data down first. The grammar is `AM <1-4> [lat,lng] [text]`,
short enough to fit one 160-character segment and simple enough to dictate over a phone call. An
SMS-only citizen has no email, so the phone number becomes the identity and the account is created on
first contact. The message carries the same `client_local_id` the app minted when it queued the report,
so a report sent by text and then replayed by the queue when data returns is one incident rather than
two. Coordinates are optional, because someone typing by hand cannot know their latitude; without them
the report falls back to that sender's last known position, stamped `sms-approx` so nobody downstream
mistakes it for a fix.

The receiving half is built, deployed and authenticated with a shared secret. The sending half needs a
number that forwards its messages to the endpoint — an Android forwarder pointed at a spare SIM, or a
bought number — and that is a deployment step, not code.

**Fourteen languages, and one thing deliberately left in the original.** The citizen app and citizen web
view run in English plus 13 Indian languages, which is 10 scripts — React Native cannot synthesise a
face it has not loaded, so each script ships its own font family and only the selected language's fonts
are loaded. Everything the product says is translated. **Nothing an authority said is.** SACHET alert
text stays exactly as the issuing agency published it, ordered so the reader's own language comes first
and labelled with the language it is in. Machine-translating an official warning would put words in a
government's mouth during an emergency, and the translation is the least trustworthy part of the
pipeline.

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
pytest                                             # 63 tests, no database required
```

Routes: `/auth/signup`, `/auth/login`, `/auth/request-password-reset`, `/auth/reset-password`,
`/alerts`, `/reports`, `/resources`, `/allocate`, `/facilities`, `/sms/inbound`,
`/internal/ingest-alerts`.

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
npx jest             # 51 tests
```

## Status

**[PROGRESS.md](PROGRESS.md)** — what is shipped, what is being hardened, and what is deliberately not
built yet, with the constraints stated honestly.
