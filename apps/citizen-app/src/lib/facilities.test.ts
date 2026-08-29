import {
  FACILITY_MIN_ZOOM,
  MAX_BOX_DEGREES,
  clampBox,
  facilityQuery,
  type FacilityKind,
} from "./facilities";

const CHENNAI = { south: 13.02, west: 80.2, north: 13.09, east: 80.28, zoom: 13 };

function kinds(...list: FacilityKind[]) {
  return new Set(list);
}

describe("facilityQuery", () => {
  it("asks for the kinds that are switched on, inside the view", () => {
    const query = facilityQuery(CHENNAI, kinds("hospital", "fire"));
    expect(query).toContain("/facilities?");
    expect(query).toContain("kinds=hospital%2Cfire");
    expect(query).toContain("south=13.02");
    expect(query).toContain("east=80.28");
  });

  it("asks for nothing when no kind is switched on", () => {
    // The layer being off is not a request for an empty answer — it is not a
    // request at all, and a phone on a weak connection should not spend one.
    expect(facilityQuery(CHENNAI, kinds())).toBeNull();
  });

  it("asks for nothing above the country", () => {
    expect(facilityQuery({ ...CHENNAI, zoom: FACILITY_MIN_ZOOM - 1 }, kinds("hospital"))).toBeNull();
  });

  it("asks at the zoom the layer starts drawing", () => {
    expect(facilityQuery({ ...CHENNAI, zoom: FACILITY_MIN_ZOOM }, kinds("hospital"))).not.toBeNull();
  });

  it("keeps the kinds in a stable order however they were ticked", () => {
    // Two identical views must produce one identical URL, or nothing upstream
    // can tell a repeat request from a new one.
    const a = facilityQuery(CHENNAI, kinds("fire", "hospital"));
    const b = facilityQuery(CHENNAI, kinds("hospital", "fire"));
    expect(a).toBe(b);
  });
});

describe("clampBox", () => {
  it("leaves a normal view alone", () => {
    expect(clampBox(CHENNAI)).toEqual({
      south: 13.02,
      west: 80.2,
      north: 13.09,
      east: 80.28,
    });
  });

  it("trims a view wider than the server will answer, keeping the centre", () => {
    // A tablet in landscape at the minimum zoom can see more than a degree.
    // Trimming here turns a 400 into a slightly smaller answer.
    const wide = clampBox({ south: 10, west: 70, north: 14, east: 76, zoom: 11 });
    expect(wide.north - wide.south).toBeCloseTo(MAX_BOX_DEGREES);
    expect(wide.east - wide.west).toBeCloseTo(MAX_BOX_DEGREES);
    expect((wide.north + wide.south) / 2).toBeCloseTo(12);
    expect((wide.east + wide.west) / 2).toBeCloseTo(73);
  });
});
