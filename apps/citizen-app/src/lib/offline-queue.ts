import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiFetch, apiFetchJson } from "./api-client";

// PS-05 calls out no-connectivity zones explicitly. A citizen standing in a
// flood with no signal must still be able to file — the report is persisted
// locally and replayed the moment the network comes back, rather than lost
// behind an error dialog.
const QUEUE_KEY = "pending-reports";

export interface PendingReport {
  localId: string;
  lat: number;
  lng: number;
  severity: string;
  description: string;
  photoUri: string | null;
  queuedAt: string;
}

type Listener = (count: number) => void;
const listeners = new Set<Listener>();

function notify(count: number) {
  listeners.forEach((l) => l(count));
}

export function subscribeToQueue(listener: Listener): () => void {
  listeners.add(listener);
  getQueue().then((q) => listener(q.length));
  return () => {
    listeners.delete(listener);
  };
}

export async function getQueue(): Promise<PendingReport[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as PendingReport[]) : [];
  } catch {
    // A corrupt queue must not brick reporting — start clean rather than throw.
    return [];
  }
}

async function writeQueue(queue: PendingReport[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  notify(queue.length);
}

export async function enqueueReport(
  report: Omit<PendingReport, "localId" | "queuedAt">
): Promise<void> {
  const queue = await getQueue();
  queue.push({
    ...report,
    localId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    queuedAt: new Date().toISOString(),
  });
  await writeQueue(queue);
}

async function sendOne(item: PendingReport): Promise<void> {
  const report = await apiFetchJson<{ id: string }>("/reports", {
    method: "POST",
    body: JSON.stringify({
      lat: item.lat,
      lng: item.lng,
      severity: item.severity,
      description: item.description,
    }),
  });

  if (item.photoUri) {
    const form = new FormData();
    // React Native's FormData takes a {uri,name,type} object, not a Blob.
    form.append("file", { uri: item.photoUri, name: "photo.jpg", type: "image/jpeg" } as never);
    const res = await apiFetch(`/reports/${report.id}/photo`, {
      method: "POST",
      body: form,
      headers: {},
    });
    // The report itself is saved at this point; a failed photo is not worth
    // replaying the whole report and creating a duplicate.
    if (!res.ok) {
      console.warn(`queued report ${item.localId}: photo upload failed (${res.status})`);
    }
  }
}

let flushing = false;

/**
 * Attempts to send every queued report. Stops at the first network failure and
 * leaves the rest queued, so a flaky connection doesn't burn through the queue.
 * Returns how many were sent.
 */
export async function flushQueue(): Promise<number> {
  if (flushing) return 0;
  flushing = true;
  try {
    let queue = await getQueue();
    let sent = 0;

    while (queue.length > 0) {
      const [next, ...rest] = queue;
      try {
        await sendOne(next);
      } catch {
        // Still offline (or the server is down) — keep everything queued.
        break;
      }
      queue = rest;
      await writeQueue(queue);
      sent += 1;
    }

    return sent;
  } finally {
    flushing = false;
  }
}
