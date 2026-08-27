"use client";

import { useMemo, useState } from "react";
import {
  CITY_COUNT,
  DISTRICT_COUNT,
  STATES,
  labelFor,
  placesIn,
  searchPlaces,
  type Place,
} from "@/lib/india-places";
import type { Coords, GeoSource, GeoStatus } from "@/lib/use-geolocation";
import { MapPinIcon } from "@/components/icons";

type FailedStatus = Exclude<GeoStatus, "ready" | "locating">;

/**
 * What went wrong, and what the citizen can do about it. "Location unavailable"
 * on its own is useless to someone standing in water — each case names the cause
 * and the way forward, because the only unacceptable outcome is being unable to
 * file the report.
 */
const EXPLANATION: Record<FailedStatus, { what: string; fix: string }> = {
  denied: {
    what: "This site is blocked from using your location.",
    fix: "If you never saw a prompt, the browser is remembering an earlier refusal — tap the padlock or (i) in the address bar and allow Location, then try again.",
  },
  timeout: {
    what: "Your device didn't return a location in time.",
    fix: "Moving outdoors usually helps, or name your place below.",
  },
  unavailable: {
    what: "Your device couldn't determine a location.",
    fix: "Common on a desktop with no GPS. Name your place below instead.",
  },
  unsupported: {
    what: "This browser doesn't support location lookup.",
    fix: "Name your place below instead.",
  },
  insecure: {
    what: "This page isn't on a secure (https) connection, so the browser refuses to share location and never shows a prompt.",
    fix: "Open the deployed https site, or name your place below.",
  },
};

/**
 * The position readout, and — when the lookup fails — the way out of it.
 *
 * A refused or failed location used to be a silent dead end. Reporting is the
 * whole point of this app, so it must stay possible: the citizen names their
 * city or district and files the report anyway, with the position clearly marked
 * as approximate so nobody downstream mistakes it for a GPS fix.
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

  const pick = (p: Place) => {
    onManual({ lat: p.lat, lng: p.lng }, labelFor(p));
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
        <p
          className="font-mono text-xs text-text-muted flex flex-wrap items-center gap-x-2 gap-y-1"
          role="status"
        >
          <MapPinIcon size={13} />
          <span className="text-text">
            {placeLabel ?? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`}
          </span>
          {source === "manual" ? (
            <span className="text-accent">approximate</span>
          ) : accuracyM !== null ? (
            <span>±{Math.round(accuracyM)} m</span>
          ) : null}
          <button
            onClick={() => setPicking((v) => !v)}
            className="underline hover:text-text cursor-pointer"
          >
            change
          </button>
        </p>
        {picking && <PlacePicker onPick={pick} />}
      </div>
    );
  }

  const { what, fix } = EXPLANATION[status as FailedStatus];

  return (
    <div className="panel-alt p-3 flex flex-col gap-2 w-full" role="alert">
      <p className="text-xs text-text leading-relaxed">{what}</p>
      <p className="text-xs text-text-muted leading-relaxed">{fix}</p>
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={onRetry} className="control font-mono text-xs px-3 py-1.5 cursor-pointer">
          Try again
        </button>
        <button
          onClick={() => setPicking((v) => !v)}
          className="control font-mono text-xs px-3 py-1.5 cursor-pointer"
        >
          {picking ? "Hide place list" : "Name my place"}
        </button>
      </div>
      {picking && <PlacePicker onPick={pick} />}
    </div>
  );
}

/**
 * Search first, browse by state second. Nearly 700 places is far too many for
 * one dropdown, and someone reporting an emergency should not have to scroll a
 * list to say where they are.
 */
function PlacePicker({ onPick }: { onPick: (p: Place) => void }) {
  const [query, setQuery] = useState("");
  const [state, setState] = useState("");

  const results = useMemo(() => {
    if (query.trim()) return searchPlaces(query);
    if (state) return placesIn(state);
    return [];
  }, [query, state]);

  return (
    <div className="panel p-2.5 flex flex-col gap-2 w-full sm:w-80">
      <input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={`Search ${CITY_COUNT} cities, ${DISTRICT_COUNT} districts…`}
        aria-label="Search for your city or district"
        className="bg-panel-alt border border-border px-2.5 py-2 text-sm outline-none w-full"
      />

      {!query.trim() && (
        <label className="flex flex-col gap-1">
          <span className="sr-only">Browse by state</span>
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
          {results.map((p) => (
            <li key={`${p.kind}-${p.state}-${p.district}-${p.name}`}>
              <button
                onClick={() => onPick(p)}
                className="w-full text-left px-2.5 py-1.5 hover:bg-panel-alt cursor-pointer flex items-baseline justify-between gap-2"
              >
                <span className="min-w-0">
                  <span className="text-sm">{p.name}</span>
                  <span className="block font-mono text-[0.65rem] text-text-muted truncate">
                    {p.kind === "city" && p.name !== p.district ? `${p.district} · ` : ""}
                    {p.state}
                  </span>
                </span>
                <span className="font-mono text-[0.6rem] text-text-muted uppercase shrink-0">
                  {p.kind}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {query.trim() && results.length === 0 && (
        <p className="text-xs text-text-muted px-1 py-2">No place matches “{query.trim()}”.</p>
      )}
    </div>
  );
}
