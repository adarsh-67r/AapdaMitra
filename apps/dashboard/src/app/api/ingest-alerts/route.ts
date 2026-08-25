import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

const SACHET_URL = "https://sachet.ndma.gov.in/cap_public_website/FetchAllAlertDetails";

interface SachetAlert {
  identifier: number | string;
  disaster_type: string;
  area_description: string;
  severity_color: "green" | "yellow" | "orange" | "red";
  severity_level: string;
  warning_message: string;
  centroid: string; // "lng,lat"
  effective_start_time: string;
  effective_end_time: string;
  actual_lang: string;
}

function parseCentroid(centroid: string): { lat: number; lng: number } | null {
  const parts = centroid.split(",").map((s) => Number(s.trim()));
  if (parts.length !== 2 || parts.some((n) => Number.isNaN(n))) return null;
  const [lng, lat] = parts;
  return { lat, lng };
}

// SACHET's timestamps look like "Mon Aug 24 23:46:00 IST 2026" — not directly
// parseable by `new Date()` in all runtimes (IST isn't a standard IANA
// abbreviation JS recognizes reliably). Strip the tz abbreviation and treat
// as IST (UTC+5:30) explicitly.
function parseSachetTime(raw: string): string | null {
  if (!raw) return null;
  const match = raw.match(/^(\w+) (\w+) (\d+) (\d+):(\d+):(\d+) IST (\d+)$/);
  if (!match) return null;
  const [, , mon, day, hh, mm, ss, year] = match;
  const months: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
  };
  const monthIdx = months[mon];
  if (monthIdx === undefined) return null;
  // Construct as UTC by subtracting the IST offset (+5:30) so the stored
  // instant is correct, then serialize.
  const utcMs = Date.UTC(Number(year), monthIdx, Number(day), Number(hh), Number(mm), Number(ss))
    - (5 * 60 + 30) * 60 * 1000;
  return new Date(utcMs).toISOString();
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.INGEST_CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const res = await fetch(SACHET_URL, { cache: "no-store" });
  if (!res.ok) {
    return NextResponse.json(
      { error: `SACHET fetch failed: ${res.status}` },
      { status: 502 }
    );
  }
  const raw: SachetAlert[] = await res.json();

  // SACHET repeats the same alert `identifier` once per language variant
  // (e.g. hi + en). Dedupe here, preferring English, since a single
  // ON CONFLICT DO UPDATE batch can't touch the same row twice.
  const byId = new Map<string, SachetAlert>();
  for (const a of raw) {
    const key = String(a.identifier);
    const existing = byId.get(key);
    if (!existing || (existing.actual_lang !== "en" && a.actual_lang === "en")) {
      byId.set(key, a);
    }
  }

  const rows = [];
  let skipped = 0;
  for (const a of byId.values()) {
    const geo = parseCentroid(a.centroid);
    if (!geo) {
      skipped++;
      continue;
    }
    rows.push({
      external_id: String(a.identifier),
      disaster_type: a.disaster_type,
      area_description: a.area_description,
      severity_color: a.severity_color,
      severity_level: a.severity_level,
      warning_message: a.warning_message,
      source: "sachet_ndma",
      lat: geo.lat,
      lng: geo.lng,
      effective_start: parseSachetTime(a.effective_start_time),
      effective_end: parseSachetTime(a.effective_end_time),
      fetched_at: new Date().toISOString(),
    });
  }

  if (rows.length === 0) {
    return NextResponse.json({ upserted: 0, skipped, total: raw.length });
  }

  const { error } = await supabaseServer()
    .from("alerts")
    .upsert(rows, { onConflict: "external_id" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ upserted: rows.length, skipped, total: raw.length });
}
