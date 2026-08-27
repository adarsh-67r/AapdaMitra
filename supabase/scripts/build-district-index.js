// One-off build script: turns the raw district GeoJSON (supabase/district_raw.geojson,
// not committed — large file) into a state/district index the citizen app uses as a
// manual location picker when the browser will not give up a position.
//
// Run with: node build-district-index.js
// Output: apps/web/src/lib/india-districts.json

const fs = require("fs");
const path = require("path");

const RAW_PATH = path.join(__dirname, "..", "district_raw.geojson");
// Both clients need the same district index — the web app for its manual place
// picker, the citizen app for the same fallback offline. Emitting to both here
// keeps them from drifting apart the way a hand copy would.
const OUT_PATHS = [
  path.join(__dirname, "..", "..", "apps", "web", "src", "lib", "india-districts.json"),
  path.join(__dirname, "..", "..", "apps", "citizen-app", "src", "lib", "india-districts.json"),
];

function ringArea(ring) {
  let sum = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum) / 2;
}

function ringCentroid(ring) {
  let a = 0, cx = 0, cy = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    const cross = x1 * y2 - x2 * y1;
    a += cross;
    cx += (x1 + x2) * cross;
    cy += (y1 + y2) * cross;
  }
  a = a / 2;
  if (Math.abs(a) < 1e-12) {
    const n = ring.length - 1;
    return [
      ring.slice(0, n).reduce((s, p) => s + p[0], 0) / n,
      ring.slice(0, n).reduce((s, p) => s + p[1], 0) / n,
    ];
  }
  return [cx / (6 * a), cy / (6 * a)];
}

/** Largest outer ring wins, so an island does not drag a mainland district out to sea. */
function featureCentroid(geometry) {
  const polygons =
    geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  let best = null;
  let bestArea = -1;
  for (const poly of polygons) {
    const outer = poly[0];
    const area = ringArea(outer);
    if (area > bestArea) {
      bestArea = area;
      best = ringCentroid(outer);
    }
  }
  return best;
}

const raw = JSON.parse(fs.readFileSync(RAW_PATH, "utf8"));
const rows = [];

for (const f of raw.features) {
  const state = f.properties.NAME_1;
  const district = f.properties.NAME_2;
  if (!state || !district || !f.geometry) continue;
  const c = featureCentroid(f.geometry);
  if (!c) continue;
  // [state, district, lat, lng] — a tuple rather than an object, because this
  // ships to every citizen on a phone and the key names would triple its size.
  rows.push([state, district, Number(c[1].toFixed(4)), Number(c[0].toFixed(4))]);
}

rows.sort((a, b) => a[0].localeCompare(b[0]) || a[1].localeCompare(b[1]));
for (const out of OUT_PATHS) fs.writeFileSync(out, JSON.stringify(rows));

const states = new Set(rows.map((r) => r[0]));
console.log(`wrote ${rows.length} districts across ${states.size} states`);
for (const out of OUT_PATHS) {
  console.log(`  ${out} (${(fs.statSync(out).size / 1024).toFixed(1)} KB)`);
}
