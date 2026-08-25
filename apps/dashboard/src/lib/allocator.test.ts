import { test } from "node:test";
import assert from "node:assert/strict";
import { pickNearestAvailable, type Resource } from "./allocator";
import { haversineKm } from "./geo";

test("haversineKm: same point is zero distance", () => {
  const p = { lat: 13.0827, lng: 80.2707 };
  assert.equal(haversineKm(p, p), 0);
});

test("haversineKm: known distance Chennai to Bangalore ~290km", () => {
  const chennai = { lat: 13.0827, lng: 80.2707 };
  const bangalore = { lat: 12.9716, lng: 77.5946 };
  const d = haversineKm(chennai, bangalore);
  assert.ok(d > 280 && d < 300, `expected ~290km, got ${d}`);
});

const resources: Resource[] = [
  { id: "near", type: "shelter", lat: 13.06, lng: 80.24, status: "available" },
  { id: "far", type: "shelter", lat: 12.9, lng: 80.1, status: "available" },
  { id: "closer-but-full", type: "shelter", lat: 13.05, lng: 80.25, status: "full" },
];

test("pickNearestAvailable: picks the nearest resource with status=available", () => {
  const report = { lat: 13.05, lng: 80.24 };
  const result = pickNearestAvailable(report, resources);
  assert.equal(result?.id, "near");
});

test("pickNearestAvailable: skips unavailable resources even if closer", () => {
  const report = { lat: 13.051, lng: 80.251 };
  // "closer-but-full" is geographically nearest but not available.
  const result = pickNearestAvailable(report, resources);
  assert.equal(result?.id, "near");
});

test("pickNearestAvailable: returns null when nothing is available", () => {
  const report = { lat: 13.05, lng: 80.24 };
  const allFull: Resource[] = resources.map((r) => ({ ...r, status: "full" }));
  const result = pickNearestAvailable(report, allFull);
  assert.equal(result, null);
});

test("pickNearestAvailable: can filter by resource type", () => {
  const withTeam: Resource[] = [
    ...resources,
    { id: "team", type: "rescue_team", lat: 13.051, lng: 80.241, status: "available" },
  ];
  const report = { lat: 13.05, lng: 80.24 };
  const result = pickNearestAvailable(report, withTeam, "rescue_team");
  assert.equal(result?.id, "team");
});
