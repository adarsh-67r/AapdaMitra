import { useEffect } from "react";
import { AppState } from "react-native";

import { flushQueue, getQueue } from "./offline-queue";

/**
 * How often to re-attempt a queue that still has something in it.
 *
 * Foreground alone is not enough on a marginal connection: someone standing in
 * a flood with one bar keeps the app open and never backgrounds it, so nothing
 * ever retried until they left the app and came back. The tick is idle whenever
 * the queue is empty, which is almost always.
 */
const RETRY_INTERVAL_MS = 30000;

/**
 * Drains the offline report queue for the whole app.
 *
 * This used to live on the report screen, which meant a report queued from SOS
 * only ever retried while that one tab was mounted. Nothing about replaying a
 * saved report belongs to a screen.
 */
export function useQueueFlush(): void {
  useEffect(() => {
    flushQueue();

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") flushQueue();
    });

    const timer = setInterval(async () => {
      if (AppState.currentState !== "active") return;
      const queue = await getQueue();
      if (queue.length > 0) flushQueue();
    }, RETRY_INTERVAL_MS);

    return () => {
      subscription.remove();
      clearInterval(timer);
    };
  }, []);
}
