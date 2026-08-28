import { haversineKm } from "@/lib/geo";

/**
 * Proves the harness runs against real app code — the preset, the transform and
 * the `@/*` alias — rather than testing geo.ts, which has not changed.
 */
describe("haversineKm", () => {
  it("measures a known distance", () => {
    // Mumbai to Pune, about 120 km apart.
    const km = haversineKm({ lat: 19.076, lng: 72.8777 }, { lat: 18.5204, lng: 73.8567 });
    expect(km).toBeGreaterThan(115);
    expect(km).toBeLessThan(125);
  });

  it("is zero for the same point", () => {
    expect(haversineKm({ lat: 12.9716, lng: 77.5946 }, { lat: 12.9716, lng: 77.5946 })).toBe(0);
  });
});
