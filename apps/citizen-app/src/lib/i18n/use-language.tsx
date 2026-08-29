import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { TYPE_BY_SCRIPT, type ScriptType } from "@/constants/script-fonts";

import { DICTIONARIES } from "./dictionaries";
import { languageFor, type Language } from "./languages";
import { makeTranslator, type Placeholders } from "./translate";

const STORAGE_KEY = "language";

interface LanguageContextValue {
  language: Language;
  /** The loaded font families for this language's script. */
  type: ScriptType;
  t: (source: string, placeholders?: Placeholders) => string;
  setLanguage: (code: string) => void;
  /** False until the stored choice has been read, so nothing renders in the
   *  wrong language for a frame and then flips. */
  ready: boolean;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

/**
 * Everyone starts in English and changes it themselves.
 *
 * Reading the device locale was the obvious thing and it is the wrong one: a
 * shared or hand-me-down phone is set to whoever set it up, and silently
 * opening in a language the holder cannot read is a worse first screen than
 * English with a visible way out. The picker is in the header of every screen.
 */
const DEFAULT_LANGUAGE = "en";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [code, setCode] = useState(DEFAULT_LANGUAGE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored) setCode(stored);
      })
      .catch(() => {
        // A device that cannot read its own storage still gets an app; it just
        // opens in English every time.
      })
      .finally(() => setReady(true));
  }, []);

  const setLanguage = useCallback((next: string) => {
    setCode(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, []);

  const value = useMemo<LanguageContextValue>(() => {
    const language = languageFor(code);
    return {
      language,
      type: TYPE_BY_SCRIPT[language.script],
      t: makeTranslator(language.code, DICTIONARIES[language.code] ?? {}),
      setLanguage,
      ready,
    };
  }, [code, setLanguage, ready]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

function useLanguageContext(): LanguageContextValue {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage must be used inside a LanguageProvider");
  return value;
}

export function useLanguage(): LanguageContextValue {
  return useLanguageContext();
}

/** The translator on its own, which is all most callers want. */
export function useT() {
  return useLanguageContext().t;
}

/** The font families for the active language's script. */
export function useType(): ScriptType {
  return useLanguageContext().type;
}
