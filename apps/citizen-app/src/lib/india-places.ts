import cityRaw from "./india-cities.json";
import districtRaw from "./india-districts.json";

/** [state, district, lat, lng] — tuples, because this ships to every phone. */
type DistrictTuple = [string, string, number, number];

/**
 * [name, districtIndex, lat, lng, population] — the district is an index into
 * the district list rather than a repeated name, so a city can never disagree
 * with the district index about which state it is in.
 */
type CityTuple = [string, number, number, number, number];

export type PlaceKind = "city" | "district";

export interface Place {
  kind: PlaceKind;
  name: string;
  district: string;
  state: string;
  lat: number;
  lng: number;
  /** Cities only: used to rank search results, not shown. */
  population?: number;
}

/**
 * Somewhere a citizen can name to say where they are, when the browser will not
 * say it for them.
 *
 * Two layers, because they answer different questions. Districts come from the
 * same GADM boundary data the alert ingestion uses, so every part of the country
 * is reachable — 594 of them across all 35 states and union territories. Cities
 * sit on top, and there are 7,120 of them: every populated place in the GeoNames
 * India dump with a recorded population, which is effectively the census town
 * list. Both are built by supabase/scripts/build-city-index.js.
 *
 * The city layer exists because a district centroid is a poor answer. Kachchh is
 * larger than several states; naming it puts a report tens of kilometres from
 * the person who filed it, and the allocator then sends the wrong team. Naming
 * Bhuj does not.
 *
 * Neither is an address. A chosen place is always marked approximate, and the
 * report records which place it was placed from so a responder can judge it.
 */

/**
 * The boundary data is GADM 2.x, which predates several changes on the ground:
 * it still says Orissa and Uttaranchal, it has no Telangana at all because it
 * was cut before the 2014 split, and it predates both Ladakh and the merger of
 * Daman and Diu with Dadra and Nagar Haveli. Left alone, the state list showed
 * both "Odisha" and "Orissa" as if they were different places.
 *
 * Renames are applied on load rather than by rewriting the source file, so
 * regenerating it from GADM stays a mechanical step.
 *
 * MUST stay identical to canonicalState in supabase/scripts/build-city-index.js,
 * which uses it to decide which district a city belongs to.
 */
const STATE_RENAMES: Record<string, string> = {
  Orissa: "Odisha",
  Uttaranchal: "Uttarakhand",
  "Andaman and Nicobar": "Andaman and Nicobar Islands",
  "Dadra and Nagar Haveli": "Dadra and Nagar Haveli and Daman and Diu",
  "Daman and Diu": "Dadra and Nagar Haveli and Daman and Diu",
};

/**
 * The ten districts that became Telangana in 2014. They are still filed under
 * Andhra Pradesh in the source data, which would put Hyderabad in the wrong
 * state — the kind of error a judge from either state notices immediately.
 */
const TELANGANA_DISTRICTS = new Set([
  "Adilabad",
  "Hyderabad",
  "Karimnagar",
  "Khammam",
  "Mahbubnagar",
  "Medak",
  "Nalgonda",
  "Nizamabad",
  "Rangareddi",
  "Warangal",
]);

/** Separated from Jammu and Kashmir as its own union territory in 2019. */
const LADAKH_DISTRICTS = new Set(["Ladakh (Leh)", "Kargil"]);

function canonicalState(state: string, district: string): string {
  if (state === "Andhra Pradesh" && TELANGANA_DISTRICTS.has(district)) return "Telangana";
  if (state === "Jammu and Kashmir" && LADAKH_DISTRICTS.has(district)) return "Ladakh";
  return STATE_RENAMES[state] ?? state;
}

const DISTRICTS: Place[] = (districtRaw as DistrictTuple[]).map(
  ([state, district, lat, lng]): Place => ({
    kind: "district",
    name: district,
    district,
    state: canonicalState(state, district),
    lat,
    lng,
  })
);

const CITIES: Place[] = (cityRaw as CityTuple[]).map(
  ([name, districtIndex, lat, lng, population]): Place => {
    const parent = DISTRICTS[districtIndex];
    return {
      kind: "city",
      name,
      district: parent.district,
      state: parent.state,
      lat,
      lng,
      population,
    };
  }
);

export const PLACES: Place[] = [...CITIES, ...DISTRICTS];

export const STATES: string[] = [...new Set(PLACES.map((p) => p.state))].sort();

export const DISTRICT_COUNT = DISTRICTS.length;
export const CITY_COUNT = CITIES.length;

export function placesIn(state: string): Place[] {
  return PLACES.filter((p) => p.state === state).sort(
    (a, b) => a.district.localeCompare(b.district) || a.kind.localeCompare(b.kind)
  );
}

/** Districts of a state, in name order. */
export function districtsIn(state: string): Place[] {
  return DISTRICTS.filter((p) => p.state === state).sort((a, b) =>
    a.district.localeCompare(b.district)
  );
}

/**
 * Cities and towns inside one district, in name order.
 *
 * Two of the 594 have none — Kinnaur and Yanam, both thinly populated — and
 * there the district itself is the answer, so the picker says so rather than
 * showing an empty step.
 */
export function citiesIn(state: string, district: string): Place[] {
  return CITIES.filter((p) => p.state === state && p.district === district).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

export function labelFor(p: Place): string {
  // A city inside a like-named district should not read "Chennai, Chennai".
  return p.kind === "city" && p.name !== p.district
    ? `${p.name}, ${p.district}, ${p.state}`
    : `${p.name}, ${p.state}`;
}

/**
 * Case-insensitive search over cities and districts, prefix matches first.
 *
 * Population breaks ties within a tier, because the index carries every town in
 * the country and several share a name: someone typing "Rampur" almost certainly
 * means the town of 300,000 rather than one of the villages.
 */
export function searchPlaces(query: string, limit = 40): Place[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const scored: { p: Place; rank: number }[] = [];
  for (const p of PLACES) {
    const name = p.name.toLowerCase();
    // Cities outrank districts on an equal match: someone typing "Pune" wants
    // the city they are standing in, not the district polygon around it.
    const base = p.kind === "city" ? 0 : 1;
    const rank = name.startsWith(q)
      ? base
      : name.includes(q)
        ? 4 + base
        : p.state.toLowerCase().startsWith(q)
          ? 8 + base
          : -1;
    if (rank >= 0) scored.push({ p, rank });
  }
  scored.sort(
    (a, b) =>
      a.rank - b.rank ||
      (b.p.population ?? 0) - (a.p.population ?? 0) ||
      a.p.name.localeCompare(b.p.name)
  );
  return scored.slice(0, limit).map((s) => s.p);
}

/** The nearest known place to a position, for naming a device-supplied fix. */
export function nearestPlace(lat: number, lng: number): Place {
  let best = PLACES[0];
  let bestD = Infinity;
  for (const p of PLACES) {
    const dy = p.lat - lat;
    const dx = (p.lng - lng) * Math.cos((lat * Math.PI) / 180);
    const sq = dy * dy + dx * dx;
    if (sq < bestD) {
      bestD = sq;
      best = p;
    }
  }
  return best;
}
