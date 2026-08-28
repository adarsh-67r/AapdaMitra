import { apiFetch, apiFetchJson } from "./api-client";
import { enqueueReport } from "./offline-queue";

export interface FileReportInput {
  lat: number;
  lng: number;
  severity: string;
  description: string;
  photoUri?: string | null;
  placeLabel?: string | null;
  locationSource?: string;
}

export type FileReportOutcome =
  | { status: "sent"; id: string; photo: "attached" | "failed" | "none" }
  | { status: "queued"; reason: string }
  | { status: "failed"; reason: string };

/**
 * The one path a report takes to the backend, whether it came from the form or
 * from SOS.
 *
 * It never rejects. Both callers are press handlers, and a rejection there is an
 * unhandled promise rejection that leaves the citizen looking at a screen where
 * nothing happened — the worst possible outcome for the one action this app
 * exists to perform. Every failure comes back as an outcome the caller can put
 * on screen.
 */
export async function fileReport(input: FileReportInput): Promise<FileReportOutcome> {
  const photoUri = input.photoUri ?? null;

  try {
    const report = await apiFetchJson<{ id: string }>("/reports", {
      method: "POST",
      body: JSON.stringify({
        lat: input.lat,
        lng: input.lng,
        severity: input.severity,
        description: input.description,
        place_label: input.placeLabel ?? null,
        location_source: input.locationSource ?? "device",
      }),
    });

    if (!photoUri) return { status: "sent", id: report.id, photo: "none" };

    // The report exists from here on, so a photo that will not upload is worth
    // telling the citizen about but is not a reason to file again. The screen
    // used to throw here, fall into the offline catch and queue a report the
    // backend had already accepted — one incident reaching the console twice,
    // which is exactly what the clustering is there to prevent.
    try {
      const form = new FormData();
      form.append("file", {
        uri: photoUri,
        name: "photo.jpg",
        type: "image/jpeg",
      } as unknown as Blob);
      const res = await apiFetch(`/reports/${report.id}/photo`, {
        method: "POST",
        body: form,
        // Empty headers: fetch must set its own multipart boundary, and the
        // client's default JSON content-type would break the upload.
        headers: {},
      });
      return { status: "sent", id: report.id, photo: res.ok ? "attached" : "failed" };
    } catch {
      return { status: "sent", id: report.id, photo: "failed" };
    }
  } catch (e) {
    const reason = e instanceof Error ? e.message : "unknown error";
    try {
      await enqueueReport({
        lat: input.lat,
        lng: input.lng,
        severity: input.severity,
        description: input.description,
        photoUri,
        placeLabel: input.placeLabel ?? null,
        locationSource: input.locationSource ?? "device",
      });
      return { status: "queued", reason };
    } catch (queueError) {
      return {
        status: "failed",
        reason: queueError instanceof Error ? queueError.message : "unknown error",
      };
    }
  }
}
