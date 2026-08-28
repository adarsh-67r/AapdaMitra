import {
  formatKm,
  summarise,
  type AlertLike,
  type ReportLike,
  type ResourceLike,
} from "@/lib/citizen-summary";

const MUMBAI = { lat: 19.076, lng: 72.8777 };

function alert(over: Partial<AlertLike> & { id: string }): AlertLike {
  return {
    disaster_type: "Flood",
    severity_color: "yellow",
    area_description: null,
    issuing_agency: null,
    lat: MUMBAI.lat,
    lng: MUMBAI.lng,
    ...over,
  };
}

function resource(over: Partial<ResourceLike> & { id: string }): ResourceLike {
  return {
    type: "shelter",
    name: "Somewhere",
    lat: MUMBAI.lat,
    lng: MUMBAI.lng,
    capacity: null,
    status: "available",
    ...over,
  };
}

const NO_REPORTS: ReportLike[] = [];

describe("summarise", () => {
  it("keeps only alerts within the nearby radius", () => {
    const near = alert({ id: "near", lat: 19.2, lng: 72.9 });
    // Delhi, about 1,150 km from Mumbai.
    const far = alert({ id: "far", lat: 28.6139, lng: 77.209 });

    const { nearbyAlerts } = summarise(MUMBAI, [near, far], [], NO_REPORTS);

    expect(nearbyAlerts.map((a) => a.row.id)).toEqual(["near"]);
  });

  it("orders nearby alerts nearest first", () => {
    const further = alert({ id: "further", lat: 19.9, lng: 72.9 });
    const closer = alert({ id: "closer", lat: 19.1, lng: 72.9 });

    const { nearbyAlerts } = summarise(MUMBAI, [further, closer], [], NO_REPORTS);

    expect(nearbyAlerts.map((a) => a.row.id)).toEqual(["closer", "further"]);
  });

  it("picks the most severe alert, not the closest one", () => {
    const closeButMild = alert({ id: "mild", severity_color: "green", lat: 19.08, lng: 72.88 });
    const fartherButSevere = alert({ id: "severe", severity_color: "red", lat: 19.6, lng: 72.9 });

    const { worstAlert } = summarise(MUMBAI, [closeButMild, fartherButSevere], [], NO_REPORTS);

    expect(worstAlert?.row.id).toBe("severe");
  });

  it("breaks a severity tie with distance", () => {
    const far = alert({ id: "far", severity_color: "red", lat: 19.9, lng: 72.9 });
    const near = alert({ id: "near", severity_color: "red", lat: 19.1, lng: 72.9 });

    const { worstAlert } = summarise(MUMBAI, [far, near], [], NO_REPORTS);

    expect(worstAlert?.row.id).toBe("near");
  });

  it("has no worst alert when nothing is nearby", () => {
    const { worstAlert, nearbyAlerts } = summarise(
      MUMBAI,
      [alert({ id: "delhi", lat: 28.6139, lng: 77.209 })],
      [],
      NO_REPORTS
    );

    expect(nearbyAlerts).toEqual([]);
    expect(worstAlert).toBeNull();
  });

  it("ignores shelters that are not available", () => {
    const full = resource({ id: "full", status: "full", lat: 19.08, lng: 72.88 });
    const open = resource({ id: "open", status: "available", lat: 19.3, lng: 72.9 });

    const { nearestShelter } = summarise(MUMBAI, [], [full, open], NO_REPORTS);

    expect(nearestShelter?.row.id).toBe("open");
  });

  it("does not offer a rescue team as a shelter", () => {
    const team = resource({ id: "team", type: "rescue_team", lat: 19.08, lng: 72.88 });

    const { nearestShelter, nearestTeam } = summarise(MUMBAI, [], [team], NO_REPORTS);

    expect(nearestShelter).toBeNull();
    expect(nearestTeam?.row.id).toBe("team");
  });

  it("reports no nearest anything when the registry is empty", () => {
    const summary = summarise(MUMBAI, [], [], NO_REPORTS);

    expect(summary.nearestShelter).toBeNull();
    expect(summary.nearestTeam).toBeNull();
  });

  it("counts only the citizen's unresolved reports as open", () => {
    const reports: ReportLike[] = [
      { id: "a", status: "open" },
      { id: "b", status: "assigned" },
      { id: "c", status: "resolved" },
    ];

    expect(summarise(MUMBAI, [], [], reports).openReports).toBe(2);
  });

  it("measures the distance it reports", () => {
    // Pune, about 120 km from Mumbai.
    const pune = resource({ id: "pune", lat: 18.5204, lng: 73.8567 });

    const { nearestShelter } = summarise(MUMBAI, [], [pune], NO_REPORTS);

    expect(nearestShelter!.km).toBeGreaterThan(115);
    expect(nearestShelter!.km).toBeLessThan(125);
  });
});

describe("formatKm", () => {
  it("keeps one decimal while a distance is still walkable", () => {
    expect(formatKm(0.42)).toBe("0.4 km");
    expect(formatKm(9.96)).toBe("10.0 km");
  });

  it("rounds once precision stops meaning anything", () => {
    expect(formatKm(10)).toBe("10 km");
    expect(formatKm(37.4)).toBe("37 km");
  });
});
