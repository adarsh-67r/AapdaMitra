# Progress

Status snapshot for AapdaMitra (PS-05). Last updated **2026-08-27**.

The point of this file is to be accurate rather than flattering: a capability listed under *Shipped*
works end to end against the live backend, and anything that does not is under *Not built* with the
reason.

## Shipped

### Backend — FastAPI, deployed

- Email + password auth (bcrypt, JWT) with password reset.
- **SACHET (NDMA) ingestion** on a 10-minute cycle — deduplicated, geocoded against bundled district
  centroids, and tagged with both the **issuing agency** (IMD regional centres, Central Water
  Commission, state SDMAs) and the **language** the alert was published in.
- Citizen reports with photo upload and ownership checks.
- **Incident clustering** — reports within 2 km / 30 minutes join one cluster, with the cluster size
  denormalised so the console can flag a hotspot without a second query.
- Resource registry with capacity and status.
- **Scored allocator** — distance in kilometres, discounted for resource-type suitability and spare
  capacity, with an explicit concurrency guard against double-dispatch. Returns the distance it chose,
  and flags a dispatch as unusually far rather than refusing it.
- **Resources are released** back to the available pool when their report is resolved.
- Authority broadcast advisories.
- 32 unit tests covering the allocator, alert parsing and auth core — no database required.

### Web (`apps/web`)

- **Homepage** — operations-instrument design: paper ground, IBM Plex, one signal red, ruled panels.
  Scroll-driven sections including an India hazard map drawn from 589 real district centroids across
  five hazard belts, with per-belt district counts computed from that data.
- `/map` — public live map of India, no login.
- **Facility layer** — 58,232 hospitals, police stations and fire stations from OpenStreetMap,
  filtered to India by polygon containment, on both the console and public maps. Off by default,
  fetched on demand, drawn from zoom 11 with an explicit cap and count.
- **Dark map theme** — the basemap follows the interface theme (OSM in light, CARTO dark in dark),
  and Leaflet's popups, tooltips, zoom controls and attribution are on the same tokens as the rest
  of the UI instead of shipping white.
- **Authority console** — map-first, with the reports queue pinned beside the map on wide screens,
  an inspector for the selected report, live density heatmap, resource management and broadcast.
  Selecting a report frames it together with the unit assigned to it.
- **Citizen view** — vertical section rail (bottom tab bar on phones), a location dashboard showing
  nearby alerts and the nearest available shelter and team with real distances, reporting with photo
  and position, and a manual place picker covering 7,120 towns and cities across all 594 districts,
  browsable state → district → town or searchable by name.

### Citizen app (`apps/citizen-app`) — Expo / React Native

- Report submission with photo and GPS, alerts, shelters, own-report tracking.
- The same manual place picker as the web client — state → district → town, or search.
- Offline report queue that replays on reconnect.
- One-tap demo account on the sign-in screen.
- Runs fully against the FastAPI backend.

### Security and infrastructure

- PostgREST access to application tables is revoked at the database — all access is through our API.
- Full pre-release code review completed; all Critical and Important findings fixed and verified.

## Recently fixed

Kept here because each was a real defect, not a polish item:

- **Citizen reports were impossible to file.** `getCurrentPosition` was called with no `timeout` (the
  default is infinite) and an empty error callback, so a denied or unavailable position left every
  submit button permanently disabled with no explanation. Now: a real deadline, distinct failure states,
  a secure-origin check, and a manual place fallback.
- **The heatmap was burying the dispatch paths.** `leaflet.heat` renders into `overlayPane`, the same
  pane Leaflet uses for vectors, and is added after them — so it painted over the dispatch lines and
  report markers. Vectors now render in their own pane above it.
- **The map covered the modals and inspector.** Leaflet gives its own panes z-indices up to 1000, which
  escaped into the page's root stacking context. The map subtree is now isolated.
- **Auto-allocate looked broken because it was silent.** `/allocate` answers `{assigned: false, reason}`
  with HTTP 200 and every caller discarded it. Outcomes are surfaced, and declined reports are
  remembered instead of being retried on every poll forever.
- **State names were a decade out of date.** The bundled boundary data is GADM 2.x — it says *Orissa*
  and *Uttaranchal* and predates Telangana entirely, so the picker offered Odisha and Orissa as separate
  places and 22 of the 103 hand-typed cities pointed at districts that do not exist in the data. The renames,
  the Telangana split, the 2019 Ladakh separation and the 2020 Dadra and Nagar Haveli / Daman and Diu merger
  are all applied on load, and the same corrections drive the city build so the two cannot drift.

## Not built

- **SMS/IVR fallback** for no-connectivity zones — an expected PS-05 outcome. The console carries a
  channel panel explicitly labelled `SIMULATED — no live telephony`. Real integration needs a paid
  telephony account and is the next build phase. It must never be presented as working.
- **Authority access is ungated** — role is chosen at signup and demo credentials ship client-side for
  the judged demo. Acceptable only in that context; needs an invite gate before any real use.
- No self-serve forgot-password screen. The backend supports the flow; there is no UI.
- No automated frontend tests. Backend allocator, parsing and auth-core are unit-tested.
- The Expo app still carries the previous dark theme and has not been brought onto the paper design
  system, so the two clients are visually out of step.
- `npm run lint` in `apps/web` is broken — `typescript-eslint` does not support the installed
  TypeScript 7. Pre-existing and unrelated to application code; typecheck and build both pass.

## Data provenance

No usage, adoption or traction figures appear anywhere in the product, because none exist. The hazard
figures on the homepage are published national exposure estimates from **NDMA** and **BMTPC**, shown with
their source. District geometry is **GADM**. The town and city index is **GeoNames** (CC BY 4.0). The
facility layer is **OpenStreetMap** (ODbL), and dark basemap tiles are **CARTO**. Alerts are live from
**SACHET**.

## Stack

- **Backend** — Python, FastAPI, PostgreSQL (Supabase-hosted, accessed directly rather than via client libraries)
- **Web** — Next.js 16, React 19, Leaflet + leaflet.heat, Framer Motion, Tailwind v4, IBM Plex
- **Citizen app** — Expo, React Native
- **Deployment** — Render (backend), Vercel (web), external cron for alert ingestion
