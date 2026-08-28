import { apiFetch, apiFetchJson } from "@/lib/api-client";
import { fileReport } from "@/lib/file-report";
import { enqueueReport } from "@/lib/offline-queue";

jest.mock("@/lib/api-client", () => ({
  apiFetch: jest.fn(),
  apiFetchJson: jest.fn(),
}));
jest.mock("@/lib/offline-queue", () => ({
  enqueueReport: jest.fn(),
}));

const mockFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;
const mockFetchJson = apiFetchJson as jest.MockedFunction<typeof apiFetchJson>;
const mockEnqueue = enqueueReport as jest.MockedFunction<typeof enqueueReport>;

const BASE = {
  lat: 23.242,
  lng: 69.6669,
  severity: "critical",
  description: "SOS - immediate emergency assistance needed",
  placeLabel: "Bhuj, Kachchh, Gujarat",
  locationSource: "manual",
};

beforeEach(() => {
  jest.resetAllMocks();
});

test("sends the report and carries the place provenance to the backend", async () => {
  mockFetchJson.mockResolvedValue({ id: "r1" } as never);

  const outcome = await fileReport(BASE);

  expect(outcome).toEqual({ status: "sent", id: "r1", photo: "none" });
  const [path, options] = mockFetchJson.mock.calls[0];
  expect(path).toBe("/reports");
  expect(JSON.parse(options!.body as string)).toEqual({
    lat: 23.242,
    lng: 69.6669,
    severity: "critical",
    description: BASE.description,
    place_label: "Bhuj, Kachchh, Gujarat",
    location_source: "manual",
  });
  expect(mockEnqueue).not.toHaveBeenCalled();
});

test("attaches a photo in a second call once the report has an id", async () => {
  mockFetchJson.mockResolvedValue({ id: "r2" } as never);
  mockFetch.mockResolvedValue({ ok: true, status: 200 } as Response);

  const outcome = await fileReport({ ...BASE, photoUri: "file:///photo.jpg" });

  expect(outcome).toEqual({ status: "sent", id: "r2", photo: "attached" });
  expect(mockFetch).toHaveBeenCalledWith(
    "/reports/r2/photo",
    expect.objectContaining({ method: "POST" })
  );
});

test("a failed photo upload does not re-file the report", async () => {
  mockFetchJson.mockResolvedValue({ id: "r3" } as never);
  mockFetch.mockResolvedValue({ ok: false, status: 500 } as Response);

  const outcome = await fileReport({ ...BASE, photoUri: "file:///photo.jpg" });

  // The report exists. Queueing it again would put one incident on the console
  // twice, which is exactly what the clustering is there to prevent.
  expect(outcome).toEqual({ status: "sent", id: "r3", photo: "failed" });
  expect(mockEnqueue).not.toHaveBeenCalled();
});

test("queues the report offline when the backend is unreachable", async () => {
  mockFetchJson.mockRejectedValue(new Error("Network request failed"));
  mockEnqueue.mockResolvedValue(undefined);

  const outcome = await fileReport({ ...BASE, photoUri: "file:///photo.jpg" });

  expect(outcome).toEqual({ status: "queued", reason: "Network request failed" });
  expect(mockEnqueue).toHaveBeenCalledWith({
    lat: 23.242,
    lng: 69.6669,
    severity: "critical",
    description: BASE.description,
    photoUri: "file:///photo.jpg",
    placeLabel: "Bhuj, Kachchh, Gujarat",
    locationSource: "manual",
  });
});

test("never rejects, even when the offline queue itself fails", async () => {
  mockFetchJson.mockRejectedValue(new Error("Network request failed"));
  mockEnqueue.mockRejectedValue(new Error("storage full"));

  // A thrown error here would be an unhandled rejection inside a press handler,
  // and the citizen would see nothing at all happen.
  const outcome = await fileReport(BASE);

  expect(outcome).toEqual({ status: "failed", reason: "storage full" });
});
