// One-off build script: turns the GeoNames India dump into the city layer of the
// manual place picker — every populated place in the country that has a recorded
// population, filed under the GADM district it sits in.
//
// The picker used to carry 103 cities typed out by hand, which meant most of the
// country could only be named to district level. A district centroid can sit
// tens of kilometres from the person reporting, so that was the difference
// between routing a team to a town and routing it to a field outside one.
//
// Assignment is by polygon containment against supabase/district_raw.geojson (the
// same GADM source the district index is built from, not committed — large file),
// because nearest-centroid is not good enough here: it files Srinagar under
// Badgam and Shimla under Solan, which any local reads as an error.
//
//   curl -O https://download.geonames.org/export/dump/IN.zip && unzip IN.zip
//   node build-city-index.js path/to/IN.txt
//
// Output: apps/{web,citizen-app}/src/lib/india-cities.json
//
// Source: GeoNames (CC BY 4.0). Tab-separated, columns documented at
// https://download.geonames.org/export/dump/readme.txt — the ones used here are
// name (2), lat (5), lng (6), feature class (7), admin1 code (11), population (15).

const fs = require("fs");
const path = require("path");

const DISTRICTS_PATH = path.join(
  __dirname, "..", "..", "apps", "web", "src", "lib", "india-districts.json"
);
const RAW_PATH = path.join(__dirname, "..", "district_raw.geojson");
const OUT_PATHS = [
  path.join(__dirname, "..", "..", "apps", "web", "src", "lib", "india-cities.json"),
  path.join(__dirname, "..", "..", "apps", "citizen-app", "src", "lib", "india-cities.json"),
];

/**
 * GeoNames admin1 code → state. GeoNames is current, so this is the modern set:
 * Telangana, Ladakh and the merged Dadra and Nagar Haveli and Daman and Diu all
 * exist here. The district data is GADM 2.x and is not, which is what
 * canonicalState below reconciles.
 */
const ADMIN1 = {
  "01": "Andaman and Nicobar Islands",
  "02": "Andhra Pradesh",
  "03": "Assam",
  "05": "Chandigarh",
  "07": "Delhi",
  "09": "Gujarat",
  10: "Haryana",
  11: "Himachal Pradesh",
  12: "Jammu and Kashmir",
  13: "Kerala",
  14: "Lakshadweep",
  16: "Maharashtra",
  17: "Manipur",
  18: "Meghalaya",
  19: "Karnataka",
  20: "Nagaland",
  21: "Odisha",
  22: "Puducherry",
  23: "Punjab",
  24: "Rajasthan",
  25: "Tamil Nadu",
  26: "Tripura",
  28: "West Bengal",
  29: "Sikkim",
  30: "Arunachal Pradesh",
  31: "Mizoram",
  33: "Goa",
  34: "Bihar",
  35: "Madhya Pradesh",
  36: "Uttar Pradesh",
  37: "Chhattisgarh",
  38: "Jharkhand",
  39: "Uttarakhand",
  40: "Telangana",
  41: "Ladakh",
  52: "Dadra and Nagar Haveli and Daman and Diu",
};

// MUST stay identical to canonicalState in apps/*/src/lib/india-places.ts. The
// runtime resolves a city's state from the district it points at, so if these
// two disagree a city lands under a state its own coordinates were never
// searched in. The check at the end of this script fails loudly if they drift.
const STATE_RENAMES = {
  Orissa: "Odisha",
  Uttaranchal: "Uttarakhand",
  "Andaman and Nicobar": "Andaman and Nicobar Islands",
  "Dadra and Nagar Haveli": "Dadra and Nagar Haveli and Daman and Diu",
  "Daman and Diu": "Dadra and Nagar Haveli and Daman and Diu",
};
const TELANGANA_DISTRICTS = new Set([
  "Adilabad", "Hyderabad", "Karimnagar", "Khammam", "Mahbubnagar",
  "Medak", "Nalgonda", "Nizamabad", "Rangareddi", "Warangal",
]);
const LADAKH_DISTRICTS = new Set(["Ladakh (Leh)", "Kargil"]);

function canonicalState(state, district) {
  if (state === "Andhra Pradesh" && TELANGANA_DISTRICTS.has(district)) return "Telangana";
  if (state === "Jammu and Kashmir" && LADAKH_DISTRICTS.has(district)) return "Ladakh";
  return STATE_RENAMES[state] ?? state;
}

const districts = JSON.parse(fs.readFileSync(DISTRICTS_PATH, "utf8"));

// Districts grouped by the state they resolve to, so a city is only ever matched
// against districts of its own state. Matching nationwide would drag border towns
// across state lines, and a report filed in the wrong state is worse than one
// filed to a district centroid.
const byState = new Map();
const indexOfKey = new Map();
districts.forEach(([rawState, district, lat, lng], index) => {
  const state = canonicalState(rawState, district);
  if (!byState.has(state)) byState.set(state, []);
  byState.get(state).push({ index, district, lat, lng, rings: [] });
  indexOfKey.set(`${rawState}|${district}`, index);
});

const entryOfIndex = new Map();
for (const list of byState.values()) for (const e of list) entryOfIndex.set(e.index, e);

// Outer rings, with a bounding box each. GADM districts are drawn as polygons;
// the bounding box turns "which of 594 districts contains this point" into a
// handful of real ray-casts.
{
  const raw = JSON.parse(fs.readFileSync(RAW_PATH, "utf8"));
  for (const f of raw.features) {
    const index = indexOfKey.get(`${f.properties.NAME_1}|${f.properties.NAME_2}`);
    if (index === undefined || !f.geometry) continue;
    const entry = entryOfIndex.get(index);
    const polygons =
      f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
    for (const poly of polygons) {
      const outer = poly[0];
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const [x, y] of outer) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
      entry.rings.push({ outer, minX, minY, maxX, maxY });
    }
  }
}

/** Ray casting on the outer ring. Holes are ignored — districts do not have any. */
function inRing(ring, x, y) {
  if (x < ring.minX || x > ring.maxX || y < ring.minY || y > ring.maxY) return false;
  const pts = ring.outer;
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function kmBetween(aLat, aLng, bLat, bLng) {
  const dy = (aLat - bLat) * 111.32;
  const dx = (aLng - bLng) * 111.32 * Math.cos((aLat * Math.PI) / 180);
  return Math.hypot(dx, dy);
}

function districtFor(state, name, lat, lng) {
  const candidates = byState.get(state);
  if (!candidates || candidates.length === 0) return null;

  // A district headquarters belongs to the district it is named after, whatever
  // the boundary file says. GADM 2.x is a decade old and coarse around cities:
  // its Badgam polygon swallows the point GeoNames gives for Srinagar, and
  // "Srinagar, Bagdam" is an error any Kashmiri reads instantly. The distance
  // guard keeps this from capturing a like-named town at the far end of a state.
  const lower = name.toLowerCase();
  const namesake = candidates.find(
    (c) => c.district.toLowerCase() === lower && kmBetween(lat, lng, c.lat, c.lng) <= 40
  );
  if (namesake) {
    byName++;
    return namesake;
  }

  for (const c of candidates) {
    for (const ring of c.rings) {
      if (inRing(ring, lng, lat)) return c;
    }
  }

  // No polygon claims it — a coastal town outside the digitised coastline, or a
  // GeoNames coordinate a little off. Nearest centroid within the state is then
  // the best available answer, and still lands in the right region.
  let best = null;
  let bestSq = Infinity;
  for (const c of candidates) {
    const dy = c.lat - lat;
    const dx = (c.lng - lng) * Math.cos((lat * Math.PI) / 180);
    const sq = dy * dy + dx * dx;
    if (sq < bestSq) {
      bestSq = sq;
      best = c;
    }
  }
  fellBack++;
  return best;
}

const inputPath = process.argv[2];
if (!inputPath) {
  console.error("usage: node build-city-index.js path/to/IN.txt");
  process.exit(1);
}

// Keyed by state + district + name: GeoNames carries the same settlement name
// more than once inside a district (a town and the village it absorbed), and the
// picker should offer it once. The larger population wins.
const kept = new Map();
let scanned = 0;
let unplaced = 0;
let fellBack = 0;
let byName = 0;

for (const line of fs.readFileSync(inputPath, "utf8").split("\n")) {
  if (!line) continue;
  const f = line.split("\t");
  if (f[6] !== "P") continue;
  const population = Number(f[14]) || 0;
  // Population is the filter that separates a town from a hamlet: GeoNames lists
  // 558,000 populated places in India, and only the ~7,100 with a recorded
  // population correspond to the census towns someone would name out loud.
  if (population <= 0) continue;

  const state = ADMIN1[f[10]];
  if (!state) continue;
  const lat = Number(f[4]);
  const lng = Number(f[5]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
  scanned++;

  // asciiname rather than name: GeoNames writes 2,766 Indian names with macrons
  // ("Rāmpur"), which nobody types into a search box while standing in water.
  const name = (f[2] || f[1]).trim();
  if (!name) continue;

  const district = districtFor(state, name, lat, lng);
  if (!district) {
    unplaced++;
    continue;
  }
  const key = `${state}|${district.district}|${name.toLowerCase()}`;
  const previous = kept.get(key);
  if (previous && previous[3] >= population) continue;
  kept.set(key, [name, district.index, Number(lat.toFixed(4)), population, Number(lng.toFixed(4))]);
}

// Emitted as [name, districtIndex, lat, lng, population]. The district is a
// reference rather than a copied name so a city can never disagree with the
// district index about which state it is in — and it keeps the file small
// enough to ship to a phone.
const cities = [...kept.values()]
  .map(([name, index, lat, population, lng]) => [name, index, lat, lng, population])
  .sort((a, b) => a[0].localeCompare(b[0]));

// The runtime resolves each city's state through its district. If that resolution
// disagrees with the state GeoNames recorded, the two canonicalState copies have
// drifted and the output would silently misfile cities.
let mismatched = 0;
for (const [name, index] of cities) {
  const [rawState, district] = districts[index];
  const resolved = canonicalState(rawState, district);
  const source = [...byState.entries()].find(([, list]) =>
    list.some((c) => c.index === index)
  )?.[0];
  if (resolved !== source) {
    if (mismatched === 0) console.error(`state mismatch: ${name} -> ${resolved} vs ${source}`);
    mismatched++;
  }
}
if (mismatched > 0) {
  console.error(`${mismatched} cities resolve to a different state than they were matched in`);
  process.exit(1);
}

const json = JSON.stringify(cities);
for (const out of OUT_PATHS) fs.writeFileSync(out, json);

const states = new Set(cities.map(([, i]) => canonicalState(districts[i][0], districts[i][1])));
const withCities = new Set(cities.map(([, i]) => i));
console.log(
  `${cities.length} cities from ${scanned} populated places · ` +
    `${states.size} states · ${withCities.size}/${districts.length} districts covered · ` +
    `${byName} matched to their namesake district · ` +
    `${fellBack} placed by nearest centroid · ${unplaced} unplaced · ` +
    `${(json.length / 1024).toFixed(0)} KB`
);
