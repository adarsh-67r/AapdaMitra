"use client";

import { useReducer } from "react";

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
