"use client";

import { useMemo } from "react";
import { haversineKm } from "@/lib/geo-client";
import { nearestDistrict } from "@/lib/india-districts";
import type { Coords, GeoSource } from "@/lib/use-geolocation";

interface AlertLike {
  id: string;
  disaster_type: string;
  severity_color: "green" | "yellow" | "orange" | "red";
  area_description: string | null;
  issuing_agency: string | null;
  lat: number;
  lng: number;
}

interface ResourceLike {
  id: string;
  type: "shelter" | "rescue_team" | "supply_stock";
  name: string;
  lat: number;
  lng: number;
  capacity: number | null;
  status: "available" | "full" | "dispatched";
}

interface ReportLike {
  id: string;
  status: "open" | "assigned" | "resolved";
}

const SEVERITY_RANK = { red: 3, orange: 2, yellow: 1, green: 0 } as const;
const SEVERITY_TOKEN = {
  red: "var(--critical)",
  orange: "var(--high)",
  yellow: "var(--medium)",
  green: "var(--available)",
} as const;

const TYPE_LABEL = {
  shelter: "Shelter",
  rescue_team: "Rescue team",
  supply_stock: "Supply stock",
} as const;

function km(n: number) {
  return n < 10 ? `${n.toFixed(1)} km` : `${Math.round(n)} km`;
}

/** A labelled readout. The label sits above the value, as on a real instrument. */
function Field({ label, value, hint, color }: { label: string; value: string; hint?: string; color?: string }) {
  return (
    <div className="flex flex-col gap-1 py-3">
      <span className="font-mono text-[0.65rem] tracking-[0.14em] text-text-muted uppercase">{label}</span>
      <span className="text-xl font-semibold tabular-nums leading-none" style={color ? { color } : undefined}>
        {value}
      </span>
      {hint && <span className="text-xs text-text-muted leading-snug">{hint}</span>}
    </div>
  );
}

/**
 * What is true at the citizen's position right now, assembled only from data the
 * system actually holds: the live alert feed, the resource registry, and their
 * own reports. Nothing here is estimated or illustrative — if a value can't be
 * computed, the field says so rather than showing a plausible number.
 */
export default function CitizenDashboard({
  coords,
  source,
  placeLabel,
  alerts,
  resources,
  myReports,
}: {
  coords: Coords | null;
  source: GeoSource;
  placeLabel: string | null;
  alerts: AlertLike[];
  resources: ResourceLike[];
  myReports: ReportLike[];
}) {
  const view = useMemo(() => {
    if (!coords) return null;

    const withDistance = <T extends { lat: number; lng: number }>(rows: T[]) =>
      rows
        .map((r) => ({ row: r, d: haversineKm(coords, r) }))
        .sort((a, b) => a.d - b.d);

    const nearbyAlerts = withDistance(alerts).filter((a) => a.d <= 150);
    const worst = [...nearbyAlerts].sort(
      (a, b) => SEVERITY_RANK[b.row.severity_color] - SEVERITY_RANK[a.row.severity_color]
    )[0];

    const shelters = withDistance(resources.filter((r) => r.type === "shelter" && r.status === "available"));
    const teams = withDistance(resources.filter((r) => r.type === "rescue_team" && r.status === "available"));
    const district = nearestDistrict(coords.lat, coords.lng);

    return { nearbyAlerts, worst, shelter: shelters[0], team: teams[0], district };
  }, [coords, alerts, resources]);

  const openReports = myReports.filter((r) => r.status !== "resolved").length;

  if (!coords || !view) {
    return (
      <div className="panel p-6">
        <p className="text-sm text-text-muted leading-relaxed">
          Once your location is set, this page shows the alerts, shelters and rescue teams nearest to you.
        </p>
      </div>
    );
  }

  const { nearbyAlerts, worst, shelter, team, district } = view;

  return (
    <div className="flex flex-col gap-6">
      <section className="panel px-5 divide-y divide-border">
        <Field
          label="Your position"
          value={placeLabel ?? `${district.district}, ${district.state}`}
          hint={
            `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` +
            (source === "manual" ? " · approximate, set by hand" : "")
          }
        />
        <Field
          label="Active alerts within 150 km"
          value={String(nearbyAlerts.length)}
          color={worst ? SEVERITY_TOKEN[worst.row.severity_color] : undefined}
          hint={
            worst
              ? `Most severe: ${worst.row.disaster_type}${
                  worst.row.issuing_agency ? ` · ${worst.row.issuing_agency}` : ""
                } · ${km(worst.d)} away`
              : "No official warnings currently cover your area."
          }
        />
        <Field
          label="Nearest available shelter"
          value={shelter ? km(shelter.d) : "None listed"}
          hint={
            shelter
              ? `${shelter.row.name}${shelter.row.capacity ? ` · capacity ${shelter.row.capacity}` : ""}`
              : "No shelter is currently marked available in the registry."
          }
        />
        <Field
          label="Nearest available rescue team"
          value={team ? km(team.d) : "None listed"}
          hint={team ? team.row.name : "No rescue team is currently marked available."}
        />
        <Field
          label="Your open reports"
          value={String(openReports)}
          hint={
            openReports > 0
              ? "Still being worked. Track them under My Reports."
              : "Nothing outstanding from you right now."
          }
        />
      </section>

      {nearbyAlerts.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="font-mono text-[0.65rem] tracking-[0.14em] text-text-muted uppercase">
            Nearest warnings
          </h3>
          {nearbyAlerts.slice(0, 4).map(({ row, d }) => (
            <article key={row.id} className="panel p-3.5 flex items-start justify-between gap-4">
              <div className="flex items-start gap-2.5 min-w-0">
                <span
                  className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                  style={{ background: SEVERITY_TOKEN[row.severity_color] }}
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{row.disaster_type}</p>
                  {row.area_description && (
                    <p className="text-xs text-text-muted truncate">{row.area_description}</p>
                  )}
                </div>
              </div>
              <span className="font-mono text-xs text-text-muted tabular-nums shrink-0">{km(d)}</span>
            </article>
          ))}
        </section>
      )}

      {(shelter || team) && (
        <section className="flex flex-col gap-2">
          <h3 className="font-mono text-[0.65rem] tracking-[0.14em] text-text-muted uppercase">
            Closest help
          </h3>
          {[shelter, team].filter(Boolean).map((entry) => (
            <article key={entry!.row.id} className="panel p-3.5 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{entry!.row.name}</p>
                <p className="font-mono text-[0.7rem] text-text-muted">
                  {TYPE_LABEL[entry!.row.type]}
                  {entry!.row.capacity ? ` · capacity ${entry!.row.capacity}` : ""}
                </p>
              </div>
              <span className="font-mono text-xs tabular-nums shrink-0">{km(entry!.d)}</span>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
