import type { MapView } from "./leaflet-html";

export type FacilityKind = "hospital" | "police" | "fire";

/** Order the chips are drawn in, and the order kinds go into a query. */
export const FACILITY_KINDS: FacilityKind[] = ["hospital", "police", "fire"];

/** English source strings, translated through t() at the call site. */
export const FACILITY_LABEL: Record<FacilityKind, string> = {
  hospital: "Hospitals",
  police: "Police stations",
  fire: "Fire stations",
};

/**
 * Below this the map is covered in overlapping dots that say nothing. The layer
 * answers "what is already near me", which is a question asked once you have
 * zoomed to where you are.
 */
export const FACILITY_MIN_ZOOM = 11;

/** Must match MAX_BOX_DEGREES in apps/backend/app/facilities.py. */
export const MAX_BOX_DEGREES = 1.0;

export interface Box {
  south: number;
  west: number;
  north: number;
  east: number;
}

/**
 * The view, narrowed to something the server will answer.
 *
 * A phone at zoom 11 sees well under a degree, but a tablet in landscape can
 * see more, and the server refuses a box that wide. Trimming around the centre
 * turns a 400 into a slightly smaller answer about the middle of the screen,
 * which is where someone is looking.
 */
export function clampBox(view: MapView): Box {
  const clamp = (low: number, high: number): [number, number] => {
    if (high - low <= MAX_BOX_DEGREES) return [low, high];
    const middle = (low + high) / 2;
    return [middle - MAX_BOX_DEGREES / 2, middle + MAX_BOX_DEGREES / 2];
  };

  const [south, north] = clamp(view.south, view.north);
  const [west, east] = clamp(view.west, view.east);
  return { south, west, north, east };
}

/**
 * The request this view and these switches call for, or null when none does.
 *
 * Kinds are ordered by FACILITY_KINDS rather than by the order they were
 * tapped, so the same view always produces the same URL — otherwise nothing
 * downstream can tell a repeated request from a new one.
 */
export function facilityQuery(view: MapView, kinds: Set<FacilityKind>): string | null {
  if (kinds.size === 0) return null;
  if (view.zoom < FACILITY_MIN_ZOOM) return null;

  const box = clampBox(view);
  const params = new URLSearchParams({
    south: String(box.south),
    west: String(box.west),
    north: String(box.north),
    east: String(box.east),
    kinds: FACILITY_KINDS.filter((k) => kinds.has(k)).join(","),
  });
  return `/facilities?${params.toString()}`;
}
