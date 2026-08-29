import { DICTIONARIES } from "@/lib/i18n/dictionaries";
import { LANGUAGES } from "@/lib/i18n/languages";
import { makeTranslator } from "@/lib/i18n/translate";

test("returns the translation for the chosen language", () => {
  const t = makeTranslator("hi", { "Report an Incident": "घटना की सूचना दें" });
  expect(t("Report an Incident")).toBe("घटना की सूचना दें");
});

test("falls back to the English source when a string is not translated", () => {
  // Never a key, never blank. A half-translated screen that reads in English is
  // usable; one showing "screen.report.title" is not, and this app is read by
  // someone in trouble.
  const t = makeTranslator("hi", {});
  expect(t("Report an Incident")).toBe("Report an Incident");
});

test("fills placeholders after translating, so word order can change", () => {
  // Hindi puts the verb last. A translation that could not move the number
  // around would force English word order onto every language.
  const t = makeTranslator("hi", { "{count} reports waiting": "{count} रिपोर्ट लंबित" });
  expect(t("{count} reports waiting", { count: 3 })).toBe("3 रिपोर्ट लंबित");
});

test("fills placeholders in the English fallback too", () => {
  const t = makeTranslator("en", {});
  expect(t("{count} reports waiting", { count: 1 })).toBe("1 reports waiting");
});

test("every language declares the script its text needs", () => {
  // A language whose font never loads renders as empty boxes — the tab-icon
  // failure again, but across a whole screen.
  for (const language of LANGUAGES) {
    expect(language.script).toBeTruthy();
    expect(language.endonym).toBeTruthy();
  }
});

test("English is the only language that needs no extra font", () => {
  expect(LANGUAGES.find((l) => l.code === "en")!.script).toBe("latin");
});

test("every language the picker offers has a dictionary, or is English", () => {
  // The picker lists LANGUAGES, not the dictionaries, so the two can drift:
  // a language could be offered and then silently show English throughout.
  // English is the source and correctly has no dictionary of its own.
  const untranslated = LANGUAGES.filter((l) => l.code !== "en" && !DICTIONARIES[l.code]);
  expect(untranslated.map((l) => l.english)).toEqual([]);
});

test("no dictionary is a fraction of another", () => {
  // A language whose file is half-written shows English for the rest, which
  // reads as a bug rather than as a translation in progress. Every dictionary
  // covers the same strings.
  const sizes = Object.entries(DICTIONARIES).map(([code, d]) => [code, Object.keys(d).length]);
  const largest = Math.max(...sizes.map(([, n]) => n as number));
  expect(sizes.filter(([, n]) => n !== largest)).toEqual([]);
});
