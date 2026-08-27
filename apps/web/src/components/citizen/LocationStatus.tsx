"use client";

import { useState } from "react";
import { INDIA_CITIES } from "@/lib/india-cities";
import type { Coords, GeoSource, GeoStatus } from "@/lib/use-geolocation";
import { MapPinIcon } from "@/components/icons";

const EXPLANATION: Record<Exclude<GeoStatus, "ready" | "locating">, string> = {
  denied: "Location access was refused, so we can't place your report automatically.",
  timeout: "Your device didn't return a location in time.",
  unavailable: "Your device couldn't determine a location — common on a desktop with no GPS.",
  unsupported: "This browser doesn't support location lookup.",
  insecure:
    "This page isn't on a secure (https) connection, so the browser refuses to share location. Pick your city instead.",
};

/**
 * The position readout, and — when the lookup fails — the way out of it.
 *
 * A refused or failed location used to be a silent dead end. Reporting is the
 * whole point of this app, so it must stay possible: the citizen picks the
 * nearest city and files the report anyway, with the position clearly marked as
 * approximate so nobody downstream mistakes it for a GPS fix.
 */
export default function LocationStatus({
  coords,
  status,
  source,
  accuracyM,
  onRetry,
  onManual,
}: {
  coords: Coords | null;
  status: GeoStatus;
  source: GeoSource;
  accuracyM: number | null;
  onRetry: () => void;
  onManual: (c: Coords) => void;
}) {
  const [picking, setPicking] = useState(false);

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
      <p className="font-mono text-xs text-text-muted flex flex-wrap items-center gap-x-2 gap-y-1" role="status">
        <MapPinIcon size={13} />
        <span className="text-text">
          {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
        </span>
        {source === "manual" ? (
          <span className="text-accent">approximate · set by hand</span>
        ) : accuracyM !== null ? (
          <span>±{Math.round(accuracyM)} m</span>
        ) : null}
        <button onClick={() => setPicking((v) => !v)} className="underline hover:text-text cursor-pointer">
          change
        </button>
        {picking && <CityPicker onPick={(c) => { onManual(c); setPicking(false); }} />}
      </p>
    );
  }

  return (
    <div className="panel-alt p-3 flex flex-col gap-2" role="alert">
      <p className="text-xs text-text-muted leading-relaxed">{EXPLANATION[status as keyof typeof EXPLANATION]}</p>
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={onRetry} className="control font-mono text-xs px-3 py-1.5 cursor-pointer">
          Try again
        </button>
        <button
          onClick={() => setPicking((v) => !v)}
          className="control font-mono text-xs px-3 py-1.5 cursor-pointer"
        >
          Choose my city instead
        </button>
      </div>
      {picking && <CityPicker onPick={(c) => { onManual(c); setPicking(false); }} />}
    </div>
  );
}

function CityPicker({ onPick }: { onPick: (c: Coords) => void }) {
  return (
    <label className="flex items-center gap-2 w-full">
      <span className="sr-only">Nearest city</span>
      <select
        autoFocus
        defaultValue=""
        onChange={(e) => {
          const city = INDIA_CITIES.find((c) => c.name === e.target.value);
          if (city) onPick({ lat: city.lat, lng: city.lng });
        }}
        className="panel font-mono text-xs px-2 py-1.5 w-full max-w-xs cursor-pointer"
      >
        <option value="" disabled>
          Select the nearest city…
        </option>
        {INDIA_CITIES.map((c) => (
          <option key={c.name} value={c.name}>
            {c.name} — {c.state}
          </option>
        ))}
      </select>
    </label>
  );
}
