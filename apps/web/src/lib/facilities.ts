export type FacilityKind = "hospital" | "police" | "fire";

/** Index into this array is the kind stored in the built file. */
export const FACILITY_KINDS: FacilityKind[] = ["hospital", "police", "fire"];

export const FACILITY_LABEL: Record<FacilityKind, string> = {
  hospital: "Hospitals",
  police: "Police stations",
  fire: "Fire stations",
};

export interface Facility {
  kind: FacilityKind;
  lat: number;
  lng: number;
  name: string;
}

/** [kind, lat, lng, name] — see supabase/scripts/build-facility-index.js. */
type FacilityTuple = [number, number, number, string];

export interface Bbox {
  south: number;
  west: number;
  north: number;
  east: number;
}

/**
 * Below this the country is covered in overlapping dots that say nothing. The
 * layer is for answering "what is already near this incident", which is a
 * question asked once you have zoomed to the incident.
 */
export const FACILITY_MIN_ZOOM = 11;

/**
 * More than this in one view is unreadable and slow to draw. Hitting the cap is
 * itself information, so callers are told when it happened.
 */
export const FACILITY_MAX_MARKERS = 400;

let pending: Promise<Facility[]> | null = null;

/**
 * The 65,690 hospitals, police stations and fire stations OpenStreetMap has for
 * India.
 *
 * Served as a static file rather than imported, because it is 2.9 MB — importing
 * it would put all of it in the JavaScript bundle for every visitor including
 * the ones who never open the layer. Fetched once, on the first switch-on, and
 * held for the life of the page.
 */
export function loadFacilities(): Promise<Facility[]> {
  if (!pending) {
    pending = fetch("/india-facilities.json")
      .then((res) => {
        if (!res.ok) throw new Error(`facility data unavailable (${res.status})`);
        return res.json() as Promise<FacilityTuple[]>;
      })
      .then((rows) =>
        rows.map(([kind, lat, lng, name]) => ({
          kind: FACILITY_KINDS[kind],
          lat,
          lng,
          name,
        }))
      )
      .catch((e) => {
        // Clear the cache so switching the layer off and on again retries,
        // rather than replaying the same failure forever.
        pending = null;
        throw e;
      });
  }
  return pending;
}

/**
 * The facilities of the requested kinds inside the view, up to the marker cap.
 *
 * A linear scan of 65,690 entries per pan is roughly a millisecond and needs no
 * index — the alternative, a spatial tree, is a lot of machinery to maintain for
 * a list that is rebuilt from a file on every page load.
 */
export function facilitiesInView(
  all: Facility[],
  bounds: Bbox,
  kinds: Set<FacilityKind>,
  limit = FACILITY_MAX_MARKERS
): { shown: Facility[]; total: number } {
  const shown: Facility[] = [];
  let total = 0;

  for (const f of all) {
    if (!kinds.has(f.kind)) continue;
    if (f.lat < bounds.south || f.lat > bounds.north) continue;
    if (f.lng < bounds.west || f.lng > bounds.east) continue;
    total++;
    if (shown.length < limit) shown.push(f);
  }

  return { shown, total };
}
