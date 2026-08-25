import { haversineKm } from "./geo";

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
