export type Dictionary = Record<string, string>;
export type Placeholders = Record<string, string | number>;

/**
 * Translation keyed by the English string itself.
 *
 * There is no separate table of ids. The English source is the key, so an
 * untranslated string degrades to readable English instead of to
 * "screen.report.title" — which matters more than tidiness in an app read by
 * someone in trouble, and means a missing entry is a small loss rather than a
 * broken screen.
 */
export function makeTranslator(_code: string, dictionary: Dictionary) {
  return function t(source: string, placeholders?: Placeholders): string {
    const translated = dictionary[source] ?? source;
    if (!placeholders) return translated;
    // Substituted after translating, so a language that moves the number to a
    // different place in the sentence can.
    return translated.replace(/\{(\w+)\}/g, (whole, name) =>
      name in placeholders ? String(placeholders[name]) : whole
    );
  };
}
