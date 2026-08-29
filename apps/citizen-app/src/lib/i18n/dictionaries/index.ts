import type { Dictionary } from "../translate";

import { bn } from "./bn";
import { hi } from "./hi";
import { mr } from "./mr";
import { te } from "./te";

/**
 * One dictionary per language, keyed by the English source string.
 *
 * English has no dictionary: it is the source, and every lookup that misses
 * falls through to the key itself. A language whose file is incomplete — or
 * absent entirely — shows English for the strings it lacks rather than a blank
 * or an identifier, so a partial translation is a partial improvement and never
 * a broken screen.
 *
 * Every dictionary here is machine-translated and has not been read by a native
 * speaker. Each file says so at the top and names the lines worth checking
 * first.
 */
export const DICTIONARIES: Record<string, Dictionary> = { hi, bn, mr, te };
