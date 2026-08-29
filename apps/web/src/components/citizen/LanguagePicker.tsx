"use client";

import { useEffect, useRef, useState } from "react";

import { LANGUAGES } from "@/lib/i18n/languages";
import { useLanguage } from "@/lib/i18n/use-language";

/**
 * Choosing the language the citizen view speaks.
 *
 * Every name is written in its own script, so a speaker finds their language by
 * recognising it rather than by reading English first — which is the whole
 * point for someone who does not read English. The English name sits beside it
 * for anyone helping them find it.
 *
 * Unlike the app, nothing has to be done about fonts here: the body stack lists
 * a face for every script, each with its own unicode-range, so the browser
 * renders each name from whichever family has the glyphs.
 */
export default function LanguagePicker() {
  const { language, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!wrap.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={wrap} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("Change language")}
        className="flex items-center gap-1.5 rounded border border-[var(--border)] px-2 py-1 text-[13px] text-[var(--text-muted)] transition-colors hover:border-[var(--text-muted)] hover:text-[var(--text)]"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="M3 12h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18"
            stroke="currentColor"
            strokeWidth="1.6"
          />
        </svg>
        {language.endonym}
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={t("Choose your language")}
          className="absolute end-0 top-full z-50 mt-1 max-h-[70vh] w-56 overflow-y-auto rounded border border-[var(--border)] bg-[var(--panel)] py-1 shadow-lg"
        >
          {LANGUAGES.map((l) => {
            const selected = l.code === language.code;
            return (
              <li key={l.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    setLanguage(l.code);
                    setOpen(false);
                  }}
                  className={`flex w-full items-baseline justify-between gap-3 px-3 py-2 text-start transition-colors hover:bg-[var(--panel-alt)] ${
                    selected ? "bg-[var(--panel-alt)]" : ""
                  }`}
                >
                  <span className={`text-[15px] ${selected ? "text-[var(--accent)]" : ""}`}>
                    {l.endonym}
                  </span>
                  <span className="text-[12px] text-[var(--text-muted)]">{l.english}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
