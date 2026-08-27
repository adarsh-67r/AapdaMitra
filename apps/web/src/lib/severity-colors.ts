"use client";

import { useEffect, useState } from "react";

/**
 * Map marker colours, resolved from the same tokens the rest of the interface
 * uses.
 *
 * Leaflet needs concrete colour strings, so these cannot simply be `var(--…)`
 * in a stylesheet. They were therefore hardcoded — and drifted, still carrying
 * the old dark-theme palette after the tokens were retuned, so the map legend
 * disagreed with every status chip beside it. Resolving the custom properties at
 * runtime keeps one source of truth and follows the theme.
 */

/** Used for the first paint and on the server, before a computed style exists. */
const FALLBACK: Record<string, string> = {
  critical: "#b3322a",
  high: "#ad5f11",
  medium: "#866c13",
  available: "#2c6742",
  assigned: "#1d537c",
  accent: "#b3322a",
  text: "#1b1a16",
};

function readToken(name: string): string {
  if (typeof window === "undefined") return FALLBACK[name] ?? "#000";
  const value = getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim();
  return value || FALLBACK[name] || "#000";
}

export interface MarkerPalette {
  alert: Record<"green" | "yellow" | "orange" | "red", string>;
  report: Record<"low" | "medium" | "high" | "critical", string>;
  resource: Record<"available" | "full" | "dispatched", string>;
  /** The line drawn from an assigned resource to its report. */
  dispatch: string;
  outline: string;
}

/** Deterministic palette used for the first paint on both server and client. */
export const FALLBACK_PALETTE: MarkerPalette = {
  alert: { green: FALLBACK.available, yellow: FALLBACK.medium, orange: FALLBACK.high, red: FALLBACK.critical },
  report: { low: FALLBACK.available, medium: FALLBACK.medium, high: FALLBACK.high, critical: FALLBACK.critical },
  resource: { available: FALLBACK.available, full: FALLBACK.critical, dispatched: FALLBACK.high },
  dispatch: FALLBACK.assigned,
  outline: FALLBACK.text,
};

export function readMarkerPalette(): MarkerPalette {
  const critical = readToken("critical");
  const high = readToken("high");
  const medium = readToken("medium");
  const available = readToken("available");
  const assigned = readToken("assigned");

  return {
    alert: { green: available, yellow: medium, orange: high, red: critical },
    report: { low: available, medium, high, critical },
    resource: { available, full: critical, dispatched: high },
    dispatch: assigned,
    outline: readToken("text"),
  };
}

/**
 * The palette, re-read whenever the theme changes. Without the observer the map
 * would keep the previous theme's marker colours until the next data poll
 * happened to re-render it.
 */
export function useMarkerPalette(): MarkerPalette {
  const [palette, setPalette] = useState<MarkerPalette>(FALLBACK_PALETTE);

  useEffect(() => {
    setPalette(readMarkerPalette());
    const observer = new MutationObserver(() => setPalette(readMarkerPalette()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  return palette;
}
