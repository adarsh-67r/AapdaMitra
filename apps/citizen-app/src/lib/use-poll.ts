import { useCallback, useEffect, useRef } from "react";

/**
 * Every live screen refreshes on the same cadence, which is the web console's.
 */
export const POLL_INTERVAL_MS = 12000;

/**
 * Runs `load` on mount and then on an interval, never twice at once.
 *
 * The overlap guard is the point. A request now waits up to twenty seconds and
 * retries twice with backoff before it gives up, so on a bad connection a
 * single load can outlive several ticks; without this, a phone with one bar
 * would stack requests on a link that is already the bottleneck. A tick that
 * arrives while the last one is still in flight is simply dropped — the next
 * one is twelve seconds away, and the data it would fetch is the same.
 */
export function usePoll(load: () => Promise<void>, intervalMs: number = POLL_INTERVAL_MS): void {
  const inFlight = useRef(false);

  const run = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      await load();
    } finally {
      inFlight.current = false;
    }
  }, [load]);

  useEffect(() => {
    run();
    const interval = setInterval(run, intervalMs);
    return () => clearInterval(interval);
  }, [run, intervalMs]);
}
