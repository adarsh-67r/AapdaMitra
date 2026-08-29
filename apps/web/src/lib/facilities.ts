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

/** Must match CELL_DEGREES in supabase/scripts/facility-cells.js. */
const CELL_DEGREES = 1;

const CELL_DIR = "/facilities";

interface Manifest {
  degrees: number;
  cells: string[];
}

/**
 * The 58,232 hospitals, police stations and fire stations OpenStreetMap has for
 * India, cut into one-degree cells.
 *
 * This was one 2.9 MB file, fetched whole the moment a checkbox was ticked and
 * then turned into 58,232 objects on the main thread — several seconds of a
 * frozen tab on a phone, for a layer that only draws at zoom 11 and closer,
 * where the view is a fraction of one cell. Now a view pulls the two to four
 * cells it actually covers: a few kilobytes each, and nothing at all for the
 * user who never opens the layer.
 *
 * Everything fetched is kept for the life of the page, so panning back over
 * ground already seen costs nothing.
 */
const loaded = new Map<string, Facility[]>();
const inFlight = new Map<string, Promise<unknown>>();
let manifest: Promise<Manifest> | null = null;

function fetchJson<T>(url: string): Promise<T> {
  return fetch(url).then((res) => {
    if (!res.ok) throw new Error(`facility data unavailable (${res.status})`);
    return res.json() as Promise<T>;
  });
}

/**
 * Which cells exist. Without it a view over the Bay of Bengal asks for a file
 * that was never written and has to treat the 404 as a failure to explain,
 * rather than as "there is nothing there" — which is the truth.
 */
function loadManifest(): Promise<Manifest> {
  if (!manifest) {
    manifest = fetchJson<Manifest>(`${CELL_DIR}/index.json`).catch((e) => {
      // Cleared so switching the layer off and on again retries, rather than
      // replaying the same failure forever.
      manifest = null;
      throw e;
    });
  }
  return manifest;
}

/** The cell keys covering `bounds`, by the same rule the build script uses. */
export function cellsForBounds(bounds: Bbox): string[] {
  const keys: string[] = [];
  const y0 = Math.floor(bounds.south / CELL_DEGREES);
  const y1 = Math.floor(bounds.north / CELL_DEGREES);
  const x0 = Math.floor(bounds.west / CELL_DEGREES);
  const x1 = Math.floor(bounds.east / CELL_DEGREES);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) keys.push(`${y}_${x}`);
  }
  return keys;
}

/**
 * The facilities for `bounds` if every cell it touches is already in hand, and
 * null if any is still missing. Callers draw on the first and wait on the
 * second, so a pan over new ground never blocks the redraw of old ground.
 */
export function cachedFacilitiesFor(bounds: Bbox): Facility[] | null {
  const out: Facility[] = [];
  for (const key of cellsForBounds(bounds)) {
    const cell = loaded.get(key);
    if (!cell) return null;
    out.push(...cell);
  }
  return out;
}

/** Fetches whatever `bounds` needs and is not already loaded or in flight. */
export async function loadFacilitiesFor(bounds: Bbox): Promise<void> {
  const { cells } = await loadManifest();
  const known = new Set(cells);

  await Promise.all(
    cellsForBounds(bounds).map((key) => {
      if (loaded.has(key)) return undefined;
      // A cell the build never wrote holds no facilities. Recording that as an
      // empty cell stops it being asked for again on every pan.
      if (!known.has(key)) {
        loaded.set(key, []);
        return undefined;
      }
      let pending = inFlight.get(key);
      if (!pending) {
        pending = fetchJson<FacilityTuple[]>(`${CELL_DIR}/${key}.json`)
          .then((rows) => {
            loaded.set(
              key,
              rows.map(([kind, lat, lng, name]) => ({
                kind: FACILITY_KINDS[kind],
                lat,
                lng,
                name,
              }))
            );
          })
          .finally(() => {
            inFlight.delete(key);
          });
        inFlight.set(key, pending);
      }
      return pending;
    })
  );
}

/**
 * The facilities of the requested kinds inside the view, up to the marker cap.
 *
 * A linear scan of one to four cells per pan is well under a millisecond and
 * needs no index — the alternative, a spatial tree, is a lot of machinery to
 * maintain for a list the cell grid has already narrowed.
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
