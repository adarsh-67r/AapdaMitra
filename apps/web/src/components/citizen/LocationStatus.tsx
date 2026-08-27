"use client";

import { useMemo, useState } from "react";
import { DISTRICTS, STATES, districtsIn, searchDistricts, type District } from "@/lib/india-districts";
import type { Coords, GeoSource, GeoStatus } from "@/lib/use-geolocation";
import { MapPinIcon } from "@/components/icons";

const EXPLANATION: Record<Exclude<GeoStatus, "ready" | "locating">, string> = {
  denied: "Location access was refused, so we can't place your report automatically.",
  timeout: "Your device didn't return a location in time.",
  unavailable: "Your device couldn't determine a location — common on a desktop with no GPS.",
  unsupported: "This browser doesn't support location lookup.",
  insecure:
    "This page isn't on a secure (https) connection, so the browser refuses to share location. Pick your district instead.",
};

export function labelFor(d: District) {
  return `${d.district}, ${d.state}`;
}

/**
 * The position readout, and — when the lookup fails — the way out of it.
 *
 * A refused or failed location used to be a silent dead end. Reporting is the
 * whole point of this app, so it must stay possible: the citizen names their
 * district and files the report anyway, with the position clearly marked as
 * approximate so nobody downstream mistakes it for a GPS fix.
 */
export default function LocationStatus({
  coords,
  status,
  source,
  accuracyM,
  placeLabel,
  onRetry,
  onManual,
}: {
  coords: Coords | null;
  status: GeoStatus;
  source: GeoSource;
  accuracyM: number | null;
  placeLabel: string | null;
  onRetry: () => void;
  onManual: (c: Coords, label: string) => void;
}) {
  const [picking, setPicking] = useState(false);

  const pick = (d: District) => {
    onManual({ lat: d.lat, lng: d.lng }, labelFor(d));
    setPicking(false);
  };

  if (status === "locating") {
    return (
      <p className="font-mono text-xs text-text-muted flex items-center gap-2" role="status">
        <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-pulse" />
        Locating…
      </p>
    );
  }

  if (status === "ready" && coords) {
    return (
      <div className="flex flex-col items-start sm:items-end gap-1.5">
        <p className="font-mono text-xs text-text-muted flex flex-wrap items-center gap-x-2 gap-y-1" role="status">
          <MapPinIcon size={13} />
          <span className="text-text">{placeLabel ?? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`}</span>
          {source === "manual" ? (
            <span className="text-accent">approximate</span>
          ) : accuracyM !== null ? (
            <span>±{Math.round(accuracyM)} m</span>
          ) : null}
          <button onClick={() => setPicking((v) => !v)} className="underline hover:text-text cursor-pointer">
            change
          </button>
        </p>
        {picking && <DistrictPicker onPick={pick} />}
      </div>
    );
  }

  return (
    <div className="panel-alt p-3 flex flex-col gap-2 w-full" role="alert">
      <p className="text-xs text-text-muted leading-relaxed">{EXPLANATION[status as keyof typeof EXPLANATION]}</p>
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={onRetry} className="control font-mono text-xs px-3 py-1.5 cursor-pointer">
          Try again
        </button>
        <button
          onClick={() => setPicking((v) => !v)}
          className="control font-mono text-xs px-3 py-1.5 cursor-pointer"
        >
          {picking ? "Hide district list" : "Choose my district"}
        </button>
      </div>
      {picking && <DistrictPicker onPick={pick} />}
    </div>
  );
}

/**
 * Search first, browse by state second. 594 districts is far too many for one
 * dropdown, and someone reporting an emergency should not have to scroll a list
 * to say where they are.
 */
function DistrictPicker({ onPick }: { onPick: (d: District) => void }) {
  const [query, setQuery] = useState("");
  const [state, setState] = useState("");

  const results = useMemo(() => {
    if (query.trim()) return searchDistricts(query);
    if (state) return districtsIn(state);
    return [];
  }, [query, state]);

  return (
    <div className="panel p-2.5 flex flex-col gap-2 w-full sm:w-80">
      <input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={`Search ${DISTRICTS.length} districts…`}
        aria-label="Search for your district"
        className="bg-panel-alt border border-border px-2.5 py-2 text-sm outline-none w-full"
      />

      {!query.trim() && (
        <label className="flex flex-col gap-1">
          <span className="sr-only">Filter by state</span>
          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="bg-panel-alt border border-border px-2 py-1.5 font-mono text-xs w-full cursor-pointer"
          >
            <option value="">Or browse by state…</option>
            {STATES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </label>
      )}

      {results.length > 0 && (
        <ul className="max-h-56 overflow-y-auto flex flex-col divide-y divide-border border border-border">
          {results.map((d) => (
            <li key={`${d.state}-${d.district}`}>
              <button
                onClick={() => onPick(d)}
                className="w-full text-left px-2.5 py-1.5 hover:bg-panel-alt cursor-pointer"
              >
                <span className="text-sm">{d.district}</span>
                <span className="block font-mono text-[0.65rem] text-text-muted">{d.state}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {query.trim() && results.length === 0 && (
        <p className="text-xs text-text-muted px-1 py-2">No district matches “{query.trim()}”.</p>
      )}
    </div>
  );
}
