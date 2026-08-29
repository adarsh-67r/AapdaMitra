import type { Dictionary } from "../translate";

/**
 * One dictionary per language, keyed by the English source string.
 *
 * English has no dictionary: it is the source, and every lookup that misses
 * falls through to the key itself. A language whose file is incomplete shows
 * English for the strings it lacks rather than a blank or an identifier.
 */
export const DICTIONARIES: Record<string, Dictionary> = {};
