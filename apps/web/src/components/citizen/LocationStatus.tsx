"use client";

import { useMemo, useState } from "react";
import {
  CITY_COUNT,
  DISTRICT_COUNT,
  STATES,
  citiesIn,
  districtsIn,
  labelFor,
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
    // Two very different remedies. A browser remembers a refusal and will not
    // ask again, and on iPhone the switch is in the system settings rather than
    // anywhere in the page — someone hunting the address bar for it will not
    // find one.
    fix: "On iPhone: Settings › Privacy & Security › Location Services, turn it on and set Safari Websites to “While Using”. On desktop: tap the padlock or (i) in the address bar and allow Location. Then try again — or just name your place below.",
  },
  timeout: {
    what: "Your device didn't return a location in time.",
    fix: "Moving outdoors usually helps, or name your place below.",
  },
  unavailable: {
    what: "Your device couldn't determine a location.",
    fix: "Common on a desktop with no GPS, and on a phone with Location Services switched off. Name your place below instead.",
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
    // Some mobile browsers only surface the permission prompt on a real tap, and
    // an in-app browser may never surface it at all. So even while a request is
    // outstanding there is always something to press, rather than a spinner that
    // might never resolve.
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <p className="font-mono text-xs text-text-muted flex items-center gap-2" role="status">
          <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-pulse" />
          Locating…
        </p>
        <button onClick={onRetry} className="font-mono text-xs underline text-text-muted hover:text-text cursor-pointer">
          Use my location
        </button>
        <button
          onClick={() => setPicking((v) => !v)}
          className="font-mono text-xs underline text-text-muted hover:text-text cursor-pointer"
        >
          Name my place
        </button>
        {picking && <PlacePicker onPick={pick} />}
      </div>
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
 * State, then district, then city.
 *
 * The cascade is the reliable path: everyone knows their state, and narrowing
 * from there always terminates somewhere real. Search sits above it for the
 * common case where someone can simply type where they are — a person in an
 * emergency should not be made to drill through three menus to say "Rourkela".
 *
 * Not every district has a city in the index; most do not. Where none is known
 * the district is the answer, and the last step says so instead of showing an
 * empty list.
 */
function PlacePicker({ onPick }: { onPick: (p: Place) => void }) {
  const [query, setQuery] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");

  const searchResults = useMemo(() => (query.trim() ? searchPlaces(query) : []), [query]);
  const districts = useMemo(() => (state ? districtsIn(state) : []), [state]);
  const cities = useMemo(
    () => (state && district ? citiesIn(state, district) : []),
    [state, district]
  );
  const districtPlace = useMemo(
    () => districts.find((d) => d.district === district) ?? null,
    [districts, district]
  );

  return (
    <div className="panel p-2.5 flex flex-col gap-2.5 w-full sm:w-80">
      <label className="flex flex-col gap-1">
        <span className="sr-only">Search for your city or district</span>
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${CITY_COUNT} cities, ${DISTRICT_COUNT} districts…`}
          className="bg-panel-alt border border-border px-2.5 py-2 text-sm outline-none w-full"
        />
      </label>

      {query.trim() ? (
        searchResults.length > 0 ? (
          <ul className="max-h-56 overflow-y-auto flex flex-col divide-y divide-border border border-border">
            {searchResults.map((p) => (
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
        ) : (
          <p className="text-xs text-text-muted px-1 py-2">No place matches “{query.trim()}”.</p>
        )
      ) : (
        <div className="flex flex-col gap-2">
          <Step n={1} label="State">
            <select
              value={state}
              onChange={(e) => {
                setState(e.target.value);
                setDistrict("");
              }}
              className="bg-panel-alt border border-border px-2 py-1.5 font-mono text-xs w-full cursor-pointer"
            >
              <option value="">Select a state…</option>
              {STATES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </Step>

          {state && (
            <Step n={2} label="District">
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="bg-panel-alt border border-border px-2 py-1.5 font-mono text-xs w-full cursor-pointer"
              >
                <option value="">Select a district…</option>
                {districts.map((d) => (
                  <option key={d.district} value={d.district}>
                    {d.district}
                  </option>
                ))}
              </select>
            </Step>
          )}

          {district && (
            <Step n={3} label="City or town">
              {cities.length > 0 ? (
                <div className="flex flex-col gap-1.5">
                  {cities.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => onPick(c)}
                      className="control text-left px-2.5 py-1.5 text-sm cursor-pointer"
                    >
                      {c.name}
                    </button>
                  ))}
                  {districtPlace && (
                    <button
                      onClick={() => onPick(districtPlace)}
                      className="font-mono text-[0.68rem] text-text-muted underline text-left hover:text-text cursor-pointer"
                    >
                      None of these — use {district} district
                    </button>
                  )}
                </div>
              ) : (
                districtPlace && (
                  <button
                    onClick={() => onPick(districtPlace)}
                    className="control-primary w-full px-2.5 py-2 text-sm cursor-pointer"
                  >
                    Use {district} district
                  </button>
                )
              )}
            </Step>
          )}
        </div>
      )}
    </div>
  );
}

function Step({ n, label, children }: { n: number; label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-[0.6rem] tracking-[0.14em] text-text-muted uppercase">
        {n} · {label}
      </span>
      {children}
    </label>
  );
}
