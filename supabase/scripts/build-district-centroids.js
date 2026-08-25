// One-off build script: converts the raw district GeoJSON (supabase/district_raw.geojson,
// not committed — large file) into a small bundled centroid lookup used by the IMD
// ingestion route to place district warnings on the map.
//
// Run with: node build-district-centroids.js
// Output: apps/dashboard/src/lib/district-centroids.json

const fs = require("fs");
const path = require("path");

const RAW_PATH = path.join(__dirname, "..", "district_raw.geojson");
const OUT_PATH = path.join(
  __dirname, "..", "..", "apps", "dashboard", "src", "lib", "district-centroids.json"
);

function ringArea(ring) {
  // Shoelace formula, unsigned. ring: [[lng, lat], ...]
  let sum = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum) / 2;
}

function ringCentroid(ring) {
  // Area-weighted polygon centroid (shoelace-based). Falls back to vertex
  // average for degenerate (near-zero-area) rings.
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
    const avg = ring.slice(0, n).reduce(
      (acc, [x, y]) => [acc[0] + x / n, acc[1] + y / n],
      [0, 0]
    );
    return avg; // [lng, lat]
  }
  return [cx / (6 * a), cy / (6 * a)]; // [lng, lat]
}

function largestPolygonCentroid(geometry) {
  // geometry.coordinates for MultiPolygon: Polygon[] where Polygon = Ring[] (outer + holes)
  // We use the outer ring (index 0) of each polygon part, pick the largest by area.
  const polygons = geometry.type === "MultiPolygon"
    ? geometry.coordinates
    : [geometry.coordinates];

  let best = null;
  let bestArea = -1;
  for (const poly of polygons) {
    const outer = poly[0];
    const area = ringArea(outer);
    if (area > bestArea) {
      bestArea = area;
      best = outer;
    }
  }
  return ringCentroid(best); // [lng, lat]
}

const raw = JSON.parse(fs.readFileSync(RAW_PATH, "utf8"));
const out = {};
const list = [];

for (const feature of raw.features) {
  const district = feature.properties.NAME_2;
  const state = feature.properties.NAME_1;
  if (!district) continue;
  const [lng, lat] = largestPolygonCentroid(feature.geometry);
  const key = district.trim().toLowerCase();
  // Keep the first occurrence for the lookup map (a handful of district names
  // repeat across states, e.g. Aurangabad, Bijapur — documented limitation).
  if (!(key in out)) {
    out[key] = [lat, lng];
  }
  list.push({ district, state, lat, lng });
}

fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, JSON.stringify({ lookup: out, districts: list }));

console.log(`Wrote ${list.length} districts (${Object.keys(out).length} unique keys) to ${OUT_PATH}`);
