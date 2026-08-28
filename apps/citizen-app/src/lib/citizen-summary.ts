import { haversineKm } from "./geo";

export interface Coords {
  lat: number;
  lng: number;
}

export interface AlertLike {
  id: string;
  disaster_type: string;
  severity_color: "green" | "yellow" | "orange" | "red";
  area_description: string | null;
  issuing_agency: string | null;
  lat: number;
  lng: number;
}

export interface ResourceLike {
  id: string;
  type: "shelter" | "rescue_team" | "supply_stock";
  name: string;
  lat: number;
  lng: number;
  capacity: number | null;
  status: "available" | "full" | "dispatched";
}

export interface ReportLike {
  id: string;
  status: "open" | "assigned" | "resolved";
}

export interface WithDistance<T> {
  row: T;
  km: number;
}

export interface CitizenSummary {
  /** Nearest first. */
  nearbyAlerts: WithDistance<AlertLike>[];
  worstAlert: WithDistance<AlertLike> | null;
  nearestShelter: WithDistance<ResourceLike> | null;
  nearestTeam: WithDistance<ResourceLike> | null;
  openReports: number;
}

/**
 * The same radius the alerts feed uses, so the dashboard count and the alerts
 * list can never disagree about what "nearby" means.
 */
export const NEARBY_RADIUS_KM = 150;

const SEVERITY_RANK: Record<AlertLike["severity_color"], number> = {
  red: 3,
  orange: 2,
  yellow: 1,
  green: 0,
};

function byDistance<T extends { lat: number; lng: number }>(
  origin: Coords,
  rows: T[]
): WithDistance<T>[] {
  return rows
    .map((row) => ({ row, km: haversineKm(origin, row) }))
    .sort((a, b) => a.km - b.km);
}

/**
 * What is true at the citizen's position right now, assembled only from data
 * the system actually holds: the live alert feed, the resource registry, and
 * their own reports.
 *
 * Pure, and shared with the web client, because both were deriving this
 * separately and could drift on what counts as nearby or as available. Nothing
 * here is estimated — a value that cannot be computed comes back null, and the
 * screen says so rather than showing a plausible number.
 */
export function summarise(
  coords: Coords,
  alerts: AlertLike[],
  resources: ResourceLike[],
  myReports: ReportLike[]
): CitizenSummary {
  const nearbyAlerts = byDistance(coords, alerts).filter((a) => a.km <= NEARBY_RADIUS_KM);

  // Severity first, then distance: the nearest alert is not the one that
  // matters most, and a citizen deciding whether to move needs the worst one.
  const worstAlert =
    [...nearbyAlerts].sort(
      (a, b) =>
        SEVERITY_RANK[b.row.severity_color] - SEVERITY_RANK[a.row.severity_color] || a.km - b.km
    )[0] ?? null;

  const available = (type: ResourceLike["type"]) =>
    byDistance(
      coords,
      resources.filter((r) => r.type === type && r.status === "available")
    )[0] ?? null;

  return {
    nearbyAlerts,
    worstAlert,
    nearestShelter: available("shelter"),
    nearestTeam: available("rescue_team"),
    openReports: myReports.filter((r) => r.status !== "resolved").length,
  };
}

/**
 * Distance as a person reads it: precise when it is close enough to walk,
 * rounded when it is not. A shelter 0.4 km away and one 37 km away are
 * different kinds of answer.
 */
export function formatKm(km: number): string {
  return km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`;
}
