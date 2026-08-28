"use client";

import { FACILITY_KINDS, FACILITY_LABEL, type FacilityKind } from "@/lib/facilities";

/**
 * Which real-world facilities the map is drawing, and what it could not draw.
 *
 * Sits over the map rather than in a side panel: the answer to "is that hospital
 * marker there because I asked for hospitals" has to be visible at the same time
 * as the marker.
 *
 * The z-index is above Leaflet's own controls (1000) but inside the map
 * wrapper's isolated stacking context, so it cannot escape over the console's
 * panels or modals.
 */
export default function MapFacilityControl({
  kinds,
  onToggle,
  note,
}: {
  kinds: Set<FacilityKind>;
  onToggle: (kind: FacilityKind) => void;
  note: string | null;
}) {
  return (
    <div
      className="panel absolute top-2 right-2 p-2 flex flex-col gap-1 text-xs max-w-[13rem]"
      style={{ zIndex: 1200 }}
    >
      <span className="font-mono text-[0.6rem] tracking-[0.14em] text-text-muted uppercase">
        Nearby facilities
      </span>
      {FACILITY_KINDS.map((kind) => (
        <label key={kind} className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={kinds.has(kind)}
            onChange={() => onToggle(kind)}
            className="cursor-pointer accent-[var(--accent)]"
          />
          <span>{FACILITY_LABEL[kind]}</span>
        </label>
      ))}
      {note && <p className="text-[0.68rem] text-text-muted leading-snug pt-0.5">{note}</p>}
    </div>
  );
}
