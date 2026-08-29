// One-off build script: turns OpenStreetMap extracts of India's hospitals,
// police stations and fire stations into the facility layer of the console map.
//
// A responder deciding where to send someone needs to see what is already there.
// The resource registry only holds the units this system manages; the hospital
// two streets from the incident exists whether or not anybody registered it.
//
// The data comes from Overpass. Hospitals cannot be fetched for the whole
// country in one request — it times out — so they are pulled in six bounding-box
// tiles and merged before this script runs. See docs in the repo history for the
// exact queries; each is of the form:
//
//   [out:json][timeout:600][bbox:6,68,22,78];
//   (node["amenity"="hospital"];way["amenity"="hospital"];);
//   out center tags qt;
//
//   node build-facility-index.js <dir with hospital.json police.json fire.json>
//
// Output: apps/web/public/facilities/ — one JSON file per one-degree cell plus
// an index of the cells that exist. Served as static assets and fetched only
// for the view on screen, so nothing like the whole 2.6 MB ever reaches a
// browser. See facility-cells.js.
//
// Source: OpenStreetMap contributors (ODbL). The map already carries OSM
// attribution for its tiles; the facility layer is covered by the same credit.

const fs = require("fs");
const path = require("path");

const { writeFacilityCells } = require("./facility-cells");

const OUT_DIR = path.join(
  __dirname, "..", "..", "apps", "web", "public", "facilities"
);
const RAW_PATH = path.join(__dirname, "..", "district_raw.geojson");

/** Index into this array is the `kind` stored per facility. */
const KINDS = ["hospital", "police", "fire"];

const SOURCES = [
  { file: "hospital.json", kind: 0 },
  { file: "police.json", kind: 1 },
  { file: "fire.json", kind: 2 },
];

const inputDir = process.argv[2];
if (!inputDir) {
  console.error("usage: node build-facility-index.js <dir with hospital.json police.json fire.json>");
  process.exit(1);
}

/**
 * OSM names run long and are frequently duplicated in full ("Government General
 * Hospital, Department of ..."). The map shows the name in a tooltip beside a
 * marker, so anything past this is noise that ships to every browser.
 */
const MAX_NAME = 48;

function cleanName(raw) {
  const name = raw.replace(/\s+/g, " ").trim();
  return name.length > MAX_NAME ? `${name.slice(0, MAX_NAME - 1).trimEnd()}…` : name;
}

/**
 * India's outline, as the union of the GADM district polygons already used for
 * the district index.
 *
 * The hospital query is fetched in bounding-box tiles because a single
 * country-wide request times out, and a box drawn around India contains parts of
 * six other countries — the first build put a hospital in Xinjiang at the top of
 * the file. Fire and police are queried by admin area and do not have this
 * problem, but every point is tested the same way rather than trusting which
 * query it came from.
 */
const rings = [];
{
  const raw = JSON.parse(fs.readFileSync(RAW_PATH, "utf8"));
  for (const f of raw.features) {
    if (!f.geometry) continue;
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
      rings.push({ outer, minX, minY, maxX, maxY });
    }
  }
}

function inIndia(lat, lng) {
  for (const ring of rings) {
    if (lng < ring.minX || lng > ring.maxX || lat < ring.minY || lat > ring.maxY) continue;
    const pts = ring.outer;
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i];
      const [xj, yj] = pts[j];
      if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
        inside = !inside;
      }
    }
    if (inside) return true;
  }
  return false;
}

const rows = [];
// A hospital is often mapped twice — once as the building outline, once as a
// node inside it — and both come back from Overpass. Rounding to ~100 m and
// keying on the name collapses the pair without merging genuinely separate
// facilities that share a name in different towns.
const seen = new Set();
const counts = { hospital: 0, police: 0, fire: 0 };
let unnamed = 0;
let outsideIndia = 0;

for (const { file, kind } of SOURCES) {
  const full = path.join(inputDir, file);
  const data = JSON.parse(fs.readFileSync(full, "utf8"));

  for (const el of data.elements) {
    const lat = el.type === "node" ? el.lat : el.center && el.center.lat;
    const lng = el.type === "node" ? el.lon : el.center && el.center.lon;
    if (typeof lat !== "number" || typeof lng !== "number") continue;

    // An unnamed point cannot be acted on — "there is a hospital somewhere here"
    // is not something a dispatcher can call.
    const rawName = el.tags && el.tags.name;
    if (!rawName) {
      unnamed++;
      continue;
    }
    const name = cleanName(rawName);

    if (!inIndia(lat, lng)) {
      outsideIndia++;
      continue;
    }

    const key = `${kind}|${lat.toFixed(3)}|${lng.toFixed(3)}|${name.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);

    counts[KINDS[kind]]++;
    rows.push([kind, Number(lat.toFixed(4)), Number(lng.toFixed(4)), name]);
  }
}

// Sorted north to south so the viewport filter can stop scanning early if it
// ever needs to; more immediately, it makes the diff of a rebuild readable.
rows.sort((a, b) => b[1] - a[1] || a[2] - b[2]);

const { cells, largest } = writeFacilityCells(rows, OUT_DIR);

console.log(
  `${rows.length} facilities · ${counts.hospital} hospitals · ${counts.police} police · ` +
    `${counts.fire} fire · ${unnamed} unnamed and ${outsideIndia} outside India skipped · ` +
    `${cells} cells, largest ${(largest / 1024).toFixed(1)} KB`
);
