# Progress

Status snapshot for AapdaMitra (PS-05). Last updated 2026-08-27.

## Shipped

**Backend** — FastAPI service, deployed and running
- Email + password auth (bcrypt, JWT), password reset
- SACHET (NDMA) alert ingestion on a 10-minute cron — deduplicated, geocoded, and tagged with the
  **issuing agency** (IMD regional centres, Central Water Commission, state SDMAs)
- Citizen reports with photo upload, ownership-checked
- Resource registry with capacity/status
- **Nearest-available allocator** (haversine), guarded against concurrent double-dispatch
- Authority broadcast advisories

**Web app** (`apps/web`)
- Public homepage — glassmorphic design, Framer Motion scroll animations, India hazard-context stats
- `/map` — public live map of India (alerts + resources), no login required
- Authority console — map-first layout, slide-over reports queue and inspector, live heatmap,
  resource management, broadcast tool
- Citizen view — option-grid menu (report / alerts / shelters / my reports / emergency contacts),
  SOS button, photo attach, location permission on load

**Citizen app** (`apps/citizen-app`) — Expo/React Native
- Report submission with photo + GPS, alerts, shelters, own-report tracking
- Fully migrated onto the FastAPI backend

**Security & infrastructure**
- Supabase's own REST API has no direct access to app tables — everything goes through our backend
- Full pre-release code review completed; all Critical and Important findings fixed and verified

## In progress

- **Citizen app redesign** — the web citizen view got the new glass design system and the option-grid
  menu; the Expo app has not yet. Since the citizen interface is meant to ship on both, the native app
  needs the same treatment.

## Known gaps / not yet started

- **SMS/IVR fallback** for no-internet zones — an expected outcome of PS-05. Currently a *simulated*
  channel panel in the dashboard (clearly labelled); real telephony integration is the next build phase.
- **Authority access is unguarded** — demo accounts are embedded client-side for the hackathon demo, and
  role selection at signup is open. Needs an invite gate before any use beyond a judged demo.
- No self-serve "forgot password" screen — the backend supports it, no UI yet.
- No automated tests for frontend auth state (backend allocator/parsing/auth-core are unit-tested).
- `npm run lint` in `apps/web` is currently broken — `typescript-eslint` does not yet support the
  installed TypeScript 7. Pre-existing, unrelated to app code.

## Stack

- Backend: Python, FastAPI, PostgreSQL (Supabase-hosted, accessed directly — not via Supabase client libraries)
- Web: Next.js, React, Leaflet + leaflet.heat, Framer Motion, Tailwind
- Citizen app: Expo, React Native
- Deployment: Render (backend), external cron for alert ingestion
