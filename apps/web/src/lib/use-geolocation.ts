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
  /** The API is absent entirely. */
  | "unsupported"
  /** The page is not on a secure origin, so the browser will never answer. */
  | "insecure";

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
  /** Human-readable name of a hand-picked place, e.g. "Prayagraj, Uttar Pradesh". */
  const [placeLabel, setPlaceLabel] = useState<string | null>(null);

  const locate = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unsupported");
      return;
    }
    // Geolocation is gated on a secure context. Served over plain HTTP — which
    // is exactly what happens when a phone opens a dev server by LAN IP — the
    // API is still present but every call is rejected, and the rejection is
    // reported as PERMISSION_DENIED. Naming it correctly here saves the user
    // hunting through browser settings for a permission they never denied.
    if (typeof window !== "undefined" && window.isSecureContext === false) {
      setStatus("insecure");
      return;
    }

    setStatus("locating");

    const onSuccess = (pos: GeolocationPosition) => {
      setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      setAccuracyM(Number.isFinite(pos.coords.accuracy) ? pos.coords.accuracy : null);
      setPlaceLabel(null);
      setSource("device");
      setStatus("ready");
    };

    const fail = (err: GeolocationPositionError) => {
      setStatus(
        err.code === err.PERMISSION_DENIED
          ? "denied"
          : err.code === err.TIMEOUT
            ? "timeout"
            : "unavailable"
      );
    };

    // Two attempts, because a high-accuracy request is what actually fails on a
    // desktop: it waits on GPS hardware that is not there. A denial is final and
    // is not worth retrying, but a timeout or a missing fix very often succeeds
    // immediately at coarse accuracy over wifi or IP.
    navigator.geolocation.getCurrentPosition(onSuccess, (err) => {
      if (err.code === err.PERMISSION_DENIED) {
        fail(err);
        return;
      }
      navigator.geolocation.getCurrentPosition(onSuccess, fail, {
        enableHighAccuracy: false,
        timeout: timeoutMs,
        maximumAge: 300_000,
      });
    }, { enableHighAccuracy: true, timeout: Math.round(timeoutMs * 0.6), maximumAge: 60_000 });
  }, [timeoutMs]);

  useEffect(() => {
    // Request first, always. Reading the stored permission state is useful — a
    // permission denied once is remembered, and re-requesting it produces no
    // prompt and no response — but it must never gate the request.
    //
    // iOS Safari does not support "geolocation" as a Permissions API name and
    // throws synchronously when asked for it. Gating on that call meant the
    // throw escaped this effect before getCurrentPosition ever ran, so on iOS
    // the prompt never appeared at all. The query is now strictly an
    // enhancement: it can only refine the status of a request already in
    // flight, and any failure is ignored.
    locate();

    let cancelled = false;
    try {
      navigator.permissions
        ?.query({ name: "geolocation" as PermissionName })
        .then((result) => {
          if (!cancelled && result.state === "denied") setStatus("denied");
        })
        .catch(() => {
          /* unsupported here; the request itself reports what happened */
        });
    } catch {
      /* Safari throws synchronously for unsupported permission names */
    }

    return () => {
      cancelled = true;
    };
  }, [locate]);

  const setManual = useCallback((next: Coords, label?: string) => {
    setCoords(next);
    setAccuracyM(null);
    setPlaceLabel(label ?? null);
    setSource("manual");
    setStatus("ready");
  }, []);

  return { coords, status, source, accuracyM, placeLabel, retry: locate, setManual };
}
