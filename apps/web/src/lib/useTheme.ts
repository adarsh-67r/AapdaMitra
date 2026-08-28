"use client";

import { useEffect, useReducer, useState } from "react";

export type Theme = "dark" | "light";

// The blocking script in layout.tsx sets data-theme on <html> before React
// hydrates. Rather than mirror that into React state (which can fall out of
// sync with the DOM on alternating toggles), read it fresh from the DOM on
// every render — the attribute is the single source of truth — and just
// force a re-render after flipping it.
function currentTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  return (document.documentElement.getAttribute("data-theme") as Theme | null) ?? "dark";
}

export function useTheme() {
  const [, forceRerender] = useReducer((n: number) => n + 1, 0);
  const theme = currentTheme();

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", next);
    document.documentElement.setAttribute("data-theme", next);
    forceRerender();
  };

  return { theme, toggle };
}

/**
 * The current theme, re-read whenever anything changes it.
 *
 * useTheme only re-renders the component that called toggle, which is enough
 * for the toggle button itself but not for anything else on the page. A Leaflet
 * map is a sibling of the toggle and holds imperative state — it has to be told
 * the theme changed, or it keeps its daylight tiles inside a dark console.
 */
export function useThemeName(): Theme {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    setTheme(currentTheme());
    const observer = new MutationObserver(() => setTheme(currentTheme()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  return theme;
}
