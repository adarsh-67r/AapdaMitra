"use client";

import { useState } from "react";
import type { FallbackEvent } from "@/lib/useFallbackSimulation";

const CHANNEL_COLOR: Record<FallbackEvent["channel"], string> = {
  SMS: "var(--assigned)",
  IVR: "var(--medium)",
};

interface Props {
  events: FallbackEvent[];
  onTriggerDemo: () => void;
}

/**
 * The planned no-internet fallback channel, shown as a collapsed strip.
 *
 * It fires on its own whenever a severe alert or critical report arrives, so it
 * needs no attention most of the time and should not take a band of the console
 * away from the map to say nothing. It opens on its own when something happens,
 * and the manual trigger stays available because a live feed cannot be relied on
 * to produce a severe alert exactly when someone is watching.
 *
 * The SIMULATED label is not decoration: there is no telephony integration
 * behind this, and it must never read as a working channel.
 */
export default function FallbackPanel({ events, onTriggerDemo }: Props) {
  const [open, setOpen] = useState(false);
  const expanded = open || events.length > 0;

  return (
    <section className="mx-7 mb-3 rounded-sm bg-panel border border-border overflow-hidden">
      <div className="px-4 py-2 flex items-center justify-between flex-wrap gap-2">
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={expanded}
          className="flex items-center gap-2 text-sm font-medium cursor-pointer hover:text-accent transition-colors"
        >
          <span
            aria-hidden
            className="font-mono text-[0.6rem] transition-transform duration-200"
            style={{ transform: expanded ? "rotate(90deg)" : "none" }}
          >
            ▶
          </span>
          No-internet fallback channel
          {events.length > 0 && (
            <span className="font-mono text-[0.65rem] tabular-nums px-1.5 py-0.5 bg-panel-alt border border-border">
              {events.length}
            </span>
          )}
        </button>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[0.65rem] px-2 py-0.5 bg-panel-alt border border-border text-text-muted">
            SIMULATED — no live telephony
          </span>
          <button
            onClick={onTriggerDemo}
            className="control font-mono text-[0.65rem] px-2.5 py-1 cursor-pointer"
          >
            Trigger sample event
          </button>
        </div>
      </div>

      {expanded && (
        <div className="flex gap-2 overflow-x-auto px-4 py-2.5 border-t border-border">
          {events.length === 0 ? (
            <span className="text-xs text-text-muted">
              Waiting for a severe alert or critical report to simulate an SMS/IVR broadcast.
            </span>
          ) : (
            events.map((e) => (
              <div
                key={e.id}
                className="flex items-center gap-2 bg-panel-alt border border-border px-3 py-1.5 whitespace-nowrap shrink-0"
              >
                <span
                  className="font-mono text-[10px] font-bold px-1.5 py-0.5"
                  style={{ background: "var(--panel)", color: CHANNEL_COLOR[e.channel] }}
                >
                  {e.channel}
                </span>
                <span className="text-xs">{e.message}</span>
              </div>
            ))
          )}
        </div>
      )}
    </section>
  );
}
