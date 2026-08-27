import type { FallbackEvent } from "@/lib/useFallbackSimulation";

const CHANNEL_COLOR: Record<FallbackEvent["channel"], string> = {
  SMS: "var(--assigned)",
  IVR: "var(--medium)",
};

interface Props {
  events: FallbackEvent[];
  onTriggerDemo: () => void;
}

export default function FallbackPanel({ events, onTriggerDemo }: Props) {
  return (
    <div className="mx-7 mb-3 rounded-sm bg-panel border border-border overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border flex items-center justify-between flex-wrap gap-2">
        <span className="text-sm font-semibold">No-Internet Fallback Channel</span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs px-2 py-0.5 rounded bg-panel-alt text-text-muted">
            SIMULATED — no live telephony
          </span>
          <button
            onClick={onTriggerDemo}
            className="font-mono text-xs px-2.5 py-1 rounded cursor-pointer"
            style={{ background: "var(--accent)", color: "var(--accent-contrast)" }}
          >
            Trigger Sample Event
          </button>
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto px-4 py-2.5">
        {events.length === 0 ? (
          <span className="text-sm text-text-muted">
            Waiting for new severe alerts or critical reports to simulate an SMS/IVR broadcast…
          </span>
        ) : (
          events.map((e) => (
            <div
              key={e.id}
              className="flex items-center gap-2 bg-panel-alt border border-border rounded-full px-3 py-1.5 whitespace-nowrap shrink-0"
            >
              <span
                className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded"
                style={{ background: "var(--panel)", color: CHANNEL_COLOR[e.channel] }}
              >
                {e.channel}
              </span>
              <span className="text-xs">{e.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
