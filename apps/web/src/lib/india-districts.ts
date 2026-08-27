import raw from "./india-districts.json";

/** [state, district, lat, lng] — a tuple, because this ships to every phone. */
type DistrictTuple = [string, string, number, number];

export interface District {
  state: string;
  district: string;
  lat: number;
  lng: number;
}

/**
 * Every district in India with its centroid, built from the same GADM boundary
 * data the alert ingestion uses to place district warnings on the map
 * (supabase/scripts/build-district-index.js).
 *
 * A district centroid is not an address. It is close enough to route a response
 * to the right area, and reports placed this way are labelled so nobody reads
 * one as a GPS fix.
 */
export const DISTRICTS: District[] = (raw as DistrictTuple[]).map(
  ([state, district, lat, lng]) => ({ state, district, lat, lng })
);

export const STATES: string[] = [...new Set(DISTRICTS.map((d) => d.state))].sort();

export function districtsIn(state: string): District[] {
  return DISTRICTS.filter((d) => d.state === state);
}

/** Case- and punctuation-insensitive search across "district, state". */
export function searchDistricts(query: string, limit = 40): District[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const scored: { d: District; rank: number }[] = [];
  for (const d of DISTRICTS) {
    const district = d.district.toLowerCase();
    const state = d.state.toLowerCase();
    // Prefix matches first — typing "che" should surface Chennai, not every
    // district that happens to contain the letters.
    const rank = district.startsWith(q) ? 0 : district.includes(q) ? 1 : state.startsWith(q) ? 2 : -1;
    if (rank >= 0) scored.push({ d, rank });
    if (scored.length > limit * 8) break;
  }
  scored.sort((a, b) => a.rank - b.rank || a.d.district.localeCompare(b.d.district));
  return scored.slice(0, limit).map((s) => s.d);
}

/** The district whose centroid is closest to a position. */
export function nearestDistrict(lat: number, lng: number): District {
  let best = DISTRICTS[0];
  let bestD = Infinity;
  for (const d of DISTRICTS) {
    const dy = d.lat - lat;
    const dx = (d.lng - lng) * Math.cos((lat * Math.PI) / 180);
    const sq = dy * dy + dx * dx;
    if (sq < bestD) {
      bestD = sq;
      best = d;
    }
  }
  return best;
}
