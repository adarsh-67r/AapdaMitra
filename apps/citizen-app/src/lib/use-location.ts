import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";

export interface Coords {
  lat: number;
  lng: number;
}

export type LocationStatus =
  | "idle"
  | "locating"
  | "ready"
  /** The user refused, or has refused before and the OS remembers. */
  | "denied"
  /** Location Services is switched off for the whole device. */
  | "disabled"
  /** The request was still outstanding when the deadline passed. */
  | "timeout"
  /** The lookup failed for some other reason. */
  | "failed";

export type LocationSource = "device" | "manual";

/** Beyond this the request has failed in practice, whatever the OS is doing. */
const DEADLINE_MS = 12_000;

/**
 * Position for the citizen app, with every failure made visible and none of them
 * a dead end.
 *
 * The screens previously each called `getCurrentPositionAsync({})` directly, with
 * no accuracy option, no deadline, and no catch — only a `finally`. That has
 * three consequences, all of which stop a report being filed:
 *
 *  - the call can wait indefinitely for a fix that never arrives, leaving the
 *    screen spinning with nothing to press;
 *  - a rejection escapes as an unhandled promise rejection rather than being
 *    reported to the person holding the phone;
 *  - a denied permission produced an alert and then nothing, so someone who
 *    declined once could never report at all.
 *
 * Filing a report is the entire purpose of this app, so a position that cannot
 * be measured has to degrade to one that can be named. `setManual` takes a place
 * the citizen picked; it is marked approximate everywhere it travels.
 */
export function useLocation() {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [status, setStatus] = useState<LocationStatus>("idle");
  const [source, setSource] = useState<LocationSource>("device");
  const [placeLabel, setPlaceLabel] = useState<string | null>(null);
  const [accuracyM, setAccuracyM] = useState<number | null>(null);

  // A late-arriving fix from an abandoned request must not overwrite a place the
  // citizen has since named by hand.
  const attempt = useRef(0);

  const locate = useCallback(async () => {
    const mine = ++attempt.current;
    setStatus("locating");

    try {
      if (!(await Location.hasServicesEnabledAsync())) {
        if (mine === attempt.current) setStatus("disabled");
        return;
      }

      const { status: permission } = await Location.requestForegroundPermissionsAsync();
      if (permission !== "granted") {
        if (mine === attempt.current) setStatus("denied");
        return;
      }

      // expo-location has no timeout option, so the deadline is enforced here.
      // Balanced accuracy rather than highest: a report is routed to an area, and
      // waiting on GPS for metre-level precision is the failure everyone hits
      // indoors and in bad weather — which is when this app is opened.
      const position = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), DEADLINE_MS)),
      ]);

      if (mine !== attempt.current) return;

      if (!position) {
        setStatus("timeout");
        return;
      }

      setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
      setAccuracyM(
        typeof position.coords.accuracy === "number" ? position.coords.accuracy : null
      );
      setPlaceLabel(null);
      setSource("device");
      setStatus("ready");
    } catch (e) {
      if (mine !== attempt.current) return;
      console.warn("location lookup failed:", e instanceof Error ? e.message : e);
      setStatus("failed");
    }
  }, []);

  useEffect(() => {
    locate();
  }, [locate]);

  const setManual = useCallback((next: Coords, label: string) => {
    // Abandon any request still in flight so its result cannot land on top of
    // the place the citizen just chose.
    attempt.current += 1;
    setCoords(next);
    setAccuracyM(null);
    setPlaceLabel(label);
    setSource("manual");
    setStatus("ready");
  }, []);

  return { coords, status, source, placeLabel, accuracyM, retry: locate, setManual };
}

/**
 * A best-effort position for screens that only want to sort or filter by
 * distance: resolves to coordinates, or to null if permission is refused, the
 * service is off, or nothing arrives before the deadline.
 *
 * It never throws and never hangs, which matters because these calls sit next to
 * data fetches. An untimed position lookup inside the same try block as a feed
 * request takes the whole screen down with it when the fix never comes.
 */
export async function tryGetPosition(timeoutMs = 6_000): Promise<Coords | null> {
  try {
    if (!(await Location.hasServicesEnabledAsync())) return null;
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return null;

    const position = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
    ]);
    if (!position) return null;
    return { lat: position.coords.latitude, lng: position.coords.longitude };
  } catch {
    return null;
  }
}
