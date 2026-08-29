"use client";

import { useMemo } from "react";
import { useLanguage } from "@/lib/i18n/use-language";
import { formatKm, NEARBY_RADIUS_KM, summarise } from "@/lib/citizen-summary";
import type { AlertLike, ReportLike, ResourceLike } from "@/lib/citizen-summary";
import { labelFor, nearestPlace } from "@/lib/india-places";
import type { Coords, GeoSource } from "@/lib/use-geolocation";

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
  const { t } = useLanguage();
  const summary = useMemo(() => {
    if (!coords) return null;
    return summarise(coords, alerts, resources, myReports);
  }, [coords, alerts, resources, myReports]);

  const place = useMemo(() => {
    if (!coords) return null;
    return nearestPlace(coords.lat, coords.lng);
  }, [coords]);

  if (!coords || !summary || !place) {
    return (
      <div className="panel p-6">
        <p className="text-sm text-text-muted leading-relaxed">
          Once your location is set, this page shows the alerts, shelters and rescue teams nearest to you.
        </p>
      </div>
    );
  }

  const { nearbyAlerts, worstAlert, nearestShelter, nearestTeam, openReports } = summary;

  return (
    <div className="flex flex-col gap-6">
      <section className="panel px-5 divide-y divide-border">
        <Field
          label={t("Your position")}
          value={placeLabel ?? labelFor(place)}
          hint={
            `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` +
            (source === "manual" ? ` · ${t("approximate, set by hand")}` : "")
          }
        />
        <Field
          label={t("Active alerts within {km} km", { km: NEARBY_RADIUS_KM })}
          value={String(nearbyAlerts.length)}
          color={worstAlert ? SEVERITY_TOKEN[worstAlert.row.severity_color] : undefined}
          hint={
            worstAlert
              ? t("Most severe: {type}{agency} · {km} away", {
                  type: worstAlert.row.disaster_type,
                  agency: worstAlert.row.issuing_agency
                    ? ` · ${worstAlert.row.issuing_agency}`
                    : "",
                  km: formatKm(worstAlert.km),
                })
              : t("No official warnings currently cover your area.")
          }
        />
        <Field
          label={t("Nearest available shelter")}
          value={nearestShelter ? formatKm(nearestShelter.km) : t("None listed")}
          hint={
            nearestShelter
              ? `${nearestShelter.row.name}${nearestShelter.row.capacity ? ` · capacity ${nearestShelter.row.capacity}` : ""}`
              : t("No shelter is currently marked available in the registry.")
          }
        />
        <Field
          label={t("Nearest available rescue team")}
          value={nearestTeam ? formatKm(nearestTeam.km) : t("None listed")}
          hint={
            nearestTeam ? nearestTeam.row.name : t("No rescue team is currently marked available.")
          }
        />
        <Field
          label={t("Your open reports")}
          value={String(openReports)}
          hint={
            openReports > 0
              ? t("Still being worked. Track them under My Reports.")
              : t("Nothing outstanding from you right now.")
          }
        />
      </section>

      {nearbyAlerts.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="font-mono text-[0.65rem] tracking-[0.14em] text-text-muted uppercase">
            Nearest warnings
          </h3>
          {nearbyAlerts.slice(0, 4).map(({ row, km }) => (
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
              <span className="font-mono text-xs text-text-muted tabular-nums shrink-0">{formatKm(km)}</span>
            </article>
          ))}
        </section>
      )}

      {(nearestShelter || nearestTeam) && (
        <section className="flex flex-col gap-2">
          <h3 className="font-mono text-[0.65rem] tracking-[0.14em] text-text-muted uppercase">
            Closest help
          </h3>
          {[nearestShelter, nearestTeam].filter(Boolean).map((entry) => (
            <article key={entry!.row.id} className="panel p-3.5 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{entry!.row.name}</p>
                <p className="font-mono text-[0.7rem] text-text-muted">
                  {TYPE_LABEL[entry!.row.type]}
                  {entry!.row.capacity ? ` · capacity ${entry!.row.capacity}` : ""}
                </p>
              </div>
              <span className="font-mono text-xs tabular-nums shrink-0">{formatKm(entry!.km)}</span>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
