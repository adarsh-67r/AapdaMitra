"use client";

import { useCallback, useEffect, useState } from "react";

export interface Coords {
  lat: number;
  lng: number;
}

export type GeoStatus =
  | "locating"
  | "ready"
  /** The user (or the browser's site settings) refused the request. */
  | "denied"
  /** No position fix available — common on desktops with no GPS or radio. */
  | "unavailable"
  /** The request was still outstanding when the deadline passed. */
  | "timeout"
  /** The API is absent, usually because the page is not on a secure origin. */
  | "unsupported";

export type GeoSource = "device" | "manual";

/**
 * Position for the citizen app, with the failures made visible.
 *
 * The previous implementation called `getCurrentPosition` with an empty error
 * callback and no `timeout`. `getCurrentPosition` defaults to an INFINITE
 * timeout, so a browser that never resolved a fix — the normal case on a
 * desktop without GPS, and on any non-secure origin — left the app waiting
 * forever with no error and no way to continue. Every control gated on having a
 * position stayed disabled permanently and said nothing about why.
 *
 * So: a real deadline, a real error path, and `setManual` so a refused or
 * failed lookup degrades to "pick your city" instead of a dead end.
 */
export function useGeolocation(timeoutMs = 10_000) {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [status, setStatus] = useState<GeoStatus>("locating");
  const [source, setSource] = useState<GeoSource>("device");
  const [accuracyM, setAccuracyM] = useState<number | null>(null);

  const locate = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unsupported");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setAccuracyM(Number.isFinite(pos.coords.accuracy) ? pos.coords.accuracy : null);
        setSource("device");
        setStatus("ready");
      },
      (err) => {
        setStatus(
          err.code === err.PERMISSION_DENIED
            ? "denied"
            : err.code === err.TIMEOUT
              ? "timeout"
              : "unavailable"
        );
      },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60_000 }
    );
  }, [timeoutMs]);

  useEffect(() => {
    locate();
  }, [locate]);

  const setManual = useCallback((next: Coords) => {
    setCoords(next);
    setAccuracyM(null);
    setSource("manual");
    setStatus("ready");
  }, []);

  return { coords, status, source, accuracyM, retry: locate, setManual };
}
