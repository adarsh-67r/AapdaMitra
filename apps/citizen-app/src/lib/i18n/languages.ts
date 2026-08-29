/**
 * The languages this app speaks.
 *
 * The thirteen languages of the Eighth Schedule with more than ten million
 * speakers, plus English — together roughly 97% of India by mother tongue.
 *
 * The other nine scheduled languages were cut deliberately rather than left
 * half-translated: each dictionary is 124 strings no native speaker has read,
 * and a shallow twenty-two is worth less than a solid thirteen. The argument
 * against is real and belongs on the record: Santali and Bodo speakers live
 * disproportionately in remote, disaster-exposed districts.
 *
 * `script` is the reason this list exists rather than a bare array of codes. No
 * single font covers these — IBM Plex, which both clients use for Latin, reaches
 * Devanagari and no further — so each language has to say which face its words
 * need. A language whose font never loads renders as empty boxes: the tab-icon
 * failure again, across a whole screen.
 *
 * `endonym` is the language's name in itself. A speaker looking for their
 * language in a list should not have to read English to find it.
 */
export type Script =
  | "latin"
  | "devanagari"
  | "bengali"
  | "gujarati"
  | "gurmukhi"
  | "odia"
  | "tamil"
  | "telugu"
  | "kannada"
  | "malayalam"
  | "arabic";

export interface Language {
  code: string;
  endonym: string;
  english: string;
  script: Script;
}

export const LANGUAGES: Language[] = [
  { code: "en", endonym: "English", english: "English", script: "latin" },
  { code: "hi", endonym: "हिन्दी", english: "Hindi", script: "devanagari" },
  { code: "bn", endonym: "বাংলা", english: "Bengali", script: "bengali" },
  { code: "mr", endonym: "मराठी", english: "Marathi", script: "devanagari" },
  { code: "te", endonym: "తెలుగు", english: "Telugu", script: "telugu" },
  { code: "ta", endonym: "தமிழ்", english: "Tamil", script: "tamil" },
  { code: "gu", endonym: "ગુજરાતી", english: "Gujarati", script: "gujarati" },
  { code: "ur", endonym: "اردو", english: "Urdu", script: "arabic" },
  { code: "kn", endonym: "ಕನ್ನಡ", english: "Kannada", script: "kannada" },
  { code: "or", endonym: "ଓଡ଼ିଆ", english: "Odia", script: "odia" },
  { code: "ml", endonym: "മലയാളം", english: "Malayalam", script: "malayalam" },
  { code: "pa", endonym: "ਪੰਜਾਬੀ", english: "Punjabi", script: "gurmukhi" },
  { code: "as", endonym: "অসমীয়া", english: "Assamese", script: "bengali" },
  { code: "mai", endonym: "मैथिली", english: "Maithili", script: "devanagari" },
];

const BY_CODE = new Map(LANGUAGES.map((l) => [l.code, l]));

export function languageFor(code: string): Language {
  return BY_CODE.get(code) ?? LANGUAGES[0];
}
