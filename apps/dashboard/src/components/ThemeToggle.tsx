"use client";

import { useTheme } from "@/lib/useTheme";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="flex items-center gap-2">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
      <button
        onClick={toggle}
        aria-label="Toggle theme"
        className="relative h-5 w-10 rounded-full border border-border bg-panel-alt cursor-pointer"
      >
        <span
          suppressHydrationWarning
          className="absolute left-0.5 top-0.5 h-3.5 w-3.5 rounded-full bg-accent transition-transform"
          style={{ transform: isDark ? "translateX(18px)" : "translateX(0)" }}
        />
      </button>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" />
      </svg>
    </div>
  );
}
