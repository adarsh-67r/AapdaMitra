// Client-side-only preview helpers used by InspectorPanel to show a
// "Nearest Available" resource + distance before an authority clicks
// "Allocate Nearest Resource". This is a deliberate duplicate of pure
// functions for UI preview purposes only — the canonical, authoritative
// allocation logic lives in apps/backend/app/allocator.py, and the actual
// allocation is always committed via the real /allocate backend call in
// useDashboardData.ts, never via these functions.

const EARTH_RADIUS_KM = 6371;

export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export type ResourceType = "shelter" | "rescue_team" | "supply_stock";
export type ResourceStatus = "available" | "full" | "dispatched";

export interface Resource {
  id: string;
  type: ResourceType;
  lat: number;
  lng: number;
  status: ResourceStatus;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

// Nearest-available-resource matching: the core coordination logic. Picks the
// closest resource (optionally filtered by type) whose status is
// "available" — everything else (full/dispatched) is skipped even if closer.
// Generic so callers with a richer Resource shape (e.g. name, capacity) get
// that shape back instead of being narrowed to the minimal fields used here.
export function pickNearestAvailable<T extends Resource>(
  point: GeoPoint,
  resources: T[],
  type?: ResourceType
): T | null {
  let best: T | null = null;
  let bestDistance = Infinity;

  for (const r of resources) {
    if (r.status !== "available") continue;
    if (type && r.type !== type) continue;
    const d = haversineKm(point, r);
    if (d < bestDistance) {
      bestDistance = d;
      best = r;
    }
  }

  return best;
}
