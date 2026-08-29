# Progress

Status snapshot for AapdaMitra (PS-05). Last updated **2026-08-29**.

The point of this file is to be accurate rather than flattering: a capability listed under *Shipped*
works end to end against the live backend.

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
- **SMS intake** — `POST /sms/inbound`, guarded by a shared secret and refusing everything while that
  secret is unset. Parses `AM <1-4> [lat,lng] [text]`, mints an account keyed on the phone number for a
  citizen who has no email, and dedupes against the app's offline queue on `client_local_id` so one
  incident stays one row whichever path reaches the server first. A message with no coordinates falls
  back to the sender's last known position, stamped `sms-approx`.
- **Facility lookup** — `GET /facilities` over a bounding box, refusing a box wider than a degree so no
  client can ask for all 58,232 rows at once.
- 63 unit tests covering the allocator, alert parsing, auth core, SMS parsing and facility queries — no
  database required.

### Web (`apps/web`)

- **Homepage** — operations-instrument design: paper ground, IBM Plex, one signal red, ruled panels.
  Scroll-driven sections including an India hazard map drawn from 589 real district centroids across
  five hazard belts, with per-belt district counts computed from that data.
- `/map` — public live map of India, no login.
- **Facility layer** — 58,232 hospitals, police stations and fire stations from OpenStreetMap,
  filtered to India by polygon containment, on both the console and public maps. Off by default,
  drawn from zoom 11 with an explicit cap and count, and delivered as 331 one-degree cells behind a
  2.6 KB manifest so a view fetches the few kilobytes it covers rather than a 2.6 MB file.
- **Dark map theme** — both themes draw the same OpenStreetMap tiles and dark inverts them in the
  browser (`invert` plus `hue-rotate(180deg)`, so parkland stays green and water stays blue). Leaflet's
  popups, tooltips, zoom controls and attribution are on the same tokens as the rest of the UI instead
  of shipping white.
- **Authority console** — map-first, with the reports queue pinned beside the map on wide screens,
  an inspector for the selected report, live density heatmap, resource management and broadcast.
  Selecting a report frames it together with the unit assigned to it.
- **Citizen view** — vertical section rail (bottom tab bar on phones), a location dashboard showing
  nearby alerts and the nearest available shelter and team with real distances, reporting with photo
  and position, and a manual place picker covering 7,120 towns and cities across all 594 districts,
  browsable state → district → town or searchable by name.
- **Language picker on the citizen view** — English plus 13 Indian languages, starting in English and
  changing only when asked. Ten scripts are loaded as web fonts and resolved per character, so a page
  can carry more than one. The homepage and the authority console are deliberately English-only.

### Citizen app (`apps/citizen-app`) — Expo / React Native

- Report submission with photo and GPS, alerts, shelters, own-report tracking.
- The same manual place picker as the web client — state → district → town, or search.
- Offline report queue that replays on reconnect, flushed on launch and whenever the app returns to the
  foreground.
- **SMS fallback** — when a report is stuck in the queue the app offers to send the oldest one as a text
  instead, composing the message and opening the messaging app. Hidden unless a gateway number is
  configured, so it can never look available when it is not.
- **14 languages** — English plus 13 Indian languages across 10 scripts, each script's fonts loaded only
  when that language is selected. Official alert text is never translated: alerts are ordered so the
  reader's language comes first and labelled with the language they are in.
- **Nearby facilities on the shelter map** — hospitals, police and fire stations as three native chips,
  fetched for the view once the map settles.
- One-tap demo account on the sign-in screen.
- Low-connectivity hardening: separate read and write timeouts, retries on reads only (a retried report
  is a second incident), and a guard against overlapping polls.
- Runs fully against the FastAPI backend. 51 unit tests.

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
- **The dark basemap started demanding an API key.** CARTO began stamping `API KEY REQUIRED` diagonally
  across every tile of the keyless `basemaps.cartocdn.com` endpoint, which is what the console's dark
  theme and the app's map were both drawing. Both now use plain OpenStreetMap with the inversion filter
  described above — no third party can put a watermark or a price on the map again.
- **Ticking a facility checkbox took the whole page down.** `drawFacilities` passed an optional `pane`
  into the marker options and no caller ever supplied one. Leaflet copies options with a plain `for…in`,
  so a key that is present and undefined overwrites the default instead of falling back to it: every
  marker was built with `pane: undefined`, `getPane()` returned undefined, and the first `appendChild`
  threw. Reproduced with a headless browser against the deployed site, then confirmed fixed against a
  local production build.
- **State names were a decade out of date.** The bundled boundary data is GADM 2.x — it says *Orissa*
  and *Uttaranchal* and predates Telangana entirely, so the picker offered Odisha and Orissa as separate
  places and 22 of the 103 hand-typed cities pointed at districts that do not exist in the data. The renames,
  the Telangana split, the 2019 Ladakh separation and the 2020 Dadra and Nagar Haveli / Daman and Diu merger
  are all applied on load, and the same corrections drive the city build so the two cannot drift.

## Data provenance

No usage, adoption or traction figures appear anywhere in the product, because none exist. The hazard
figures on the homepage are published national exposure estimates from **NDMA** and **BMTPC**, shown with
their source. District geometry is **GADM**. The town and city index is **GeoNames** (CC BY 4.0). The
facility layer is **OpenStreetMap** (ODbL), and both basemaps are **OpenStreetMap** — the dark one is
the same tiles inverted in the browser. Alerts are live from **SACHET**.

## Stack

- **Backend** — Python, FastAPI, PostgreSQL (Supabase-hosted, accessed directly rather than via client libraries)
- **Web** — Next.js 16, React 19, Leaflet + leaflet.heat, Framer Motion, Tailwind v4, IBM Plex
- **Citizen app** — Expo, React Native
- **Deployment** — Render (backend), Vercel (web), external cron for alert ingestion
