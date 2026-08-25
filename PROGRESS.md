# Progress

Status snapshot for AapdaMitra (PS-05). Last updated 2026-08-25.

## Done

- **Backend**: FastAPI service — auth (signup/login/password reset), alerts (SACHET ingestion + broadcast), citizen reports with photo upload, resource management, nearest-available allocation.
- **Dashboard**: authority web app — live map (reports + resources), inspector/allocation panel, resource management, broadcast advisories, embedded citizen view. Fully migrated off Supabase Auth/Realtime onto the FastAPI backend, polling-based.
- **Citizen app**: Expo app — submit reports with photo + location, browse alerts and shelters, track own reports. Fully migrated onto the FastAPI backend.
- **Alert ingestion cron**: scheduled job hitting the backend every 10 minutes to keep alerts fresh and the free-tier instance warm.
- **Database lockdown**: Supabase's own REST API no longer has direct read/write access to app tables — all access goes through the backend.

## In progress

Working through the findings from a full pre-release review of the backend rewrite:

- Fixing a data-exposure gap left over from disabling row-level security (tightening database grants — code is done, verifying against the live deployment).
- Fixing a bug where photo uploads silently fail on the citizen app's native build (worked in the browser preview, not on a real phone).
- Ownership checks on the photo-upload endpoint, a double-booking race in the allocator under concurrent requests, resources not returning to the available pool after a report is reopened, and expired-login handling across both apps.

## Known gaps / not yet started

- No self-serve "forgot password" screen in either frontend yet — the backend supports it, the UI doesn't.
- Authority signup is currently open to anyone who picks that role at signup — fine for a demo/judged environment, needs an invite gate before any wider release.
- No automated tests for the shared auth-state logic in the frontends (backend's allocator/parsing/auth-core logic is unit-tested).
- Homepage / public-facing landing page redesign — deferred until the backend migration and review fixes above are fully closed out.

## Stack

- Backend: Python, FastAPI, Postgres (hosted on Supabase, accessed directly — not through Supabase's client libraries)
- Dashboard: Next.js, React, Leaflet
- Citizen app: Expo, React Native
- Deployment: Render (backend), external cron for alert ingestion
