"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { DICTIONARIES } from "./dictionaries";
import { languageFor, type Language } from "./languages";
import { makeTranslator, type Placeholders } from "./translate";

const STORAGE_KEY = "language";

/**
 * Everyone starts in English and changes it themselves — the same rule the app
 * follows. Reading navigator.language was the obvious thing and it is the wrong
 * one: a shared or public machine is set to whoever set it up, and silently
 * opening in a language the reader cannot read is a worse first screen than
 * English with a visible way out.
 */
const DEFAULT_LANGUAGE = "en";

/** Written to <html dir> so the browser lays these out right to left. */
const RTL = new Set(["ur", "ks", "sd"]);

interface LanguageContextValue {
  language: Language;
  t: (source: string, placeholders?: Placeholders) => string;
  setLanguage: (code: string) => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [code, setCode] = useState(DEFAULT_LANGUAGE);

  // After hydration, not during: the server rendered English, and reading
  // localStorage while rendering would make the first client render disagree
  // with the markup it is hydrating.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) setCode(stored);
    } catch {
      // Storage can be blocked outright. The page still works, in English.
    }
  }, []);

  // The document element carries the language for screen readers and
  // hyphenation, and the direction for the three right-to-left scripts.
  useEffect(() => {
    document.documentElement.lang = code;
    document.documentElement.dir = RTL.has(code) ? "rtl" : "ltr";
  }, [code]);

  const setLanguage = useCallback((next: string) => {
    setCode(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // The choice holds for this visit even if it cannot be remembered.
    }
  }, []);

  const value = useMemo<LanguageContextValue>(() => {
    const language = languageFor(code);
    return {
      language,
      t: makeTranslator(language.code, DICTIONARIES[language.code] ?? {}),
      setLanguage,
    };
  }, [code, setLanguage]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage must be used inside a LanguageProvider");
  return value;
}

/** The translator alone, which is all most callers want. */
export function useT() {
  return useLanguage().t;
}
