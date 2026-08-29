import type { Theme } from "./useTheme";

export interface Basemap {
  url: string;
  attribution: string;
  /** Put on the layer's tile container, so the filter reaches tiles only. */
  className?: string;
}

/**
 * The tiles under everything else.
 *
 * The console is read in a dark room during a night operation as often as in
 * daylight, and a full-brightness street map inside a dark interface is the one
 * surface that blows out the whole screen — it also destroys the contrast the
 * severity colours depend on, because every marker is judged against the ground
 * it sits on.
 *
 * Both themes now draw the same plain OpenStreetMap tiles, and dark is filtered
 * in the browser. This used to be CARTO's ready-made dark basemap, which was
 * better: a CSS `invert(1)` over OSM turns its green parkland magenta and its
 * blue water orange. But CARTO began stamping API KEY REQUIRED diagonally
 * across every tile of the keyless endpoint, so that basemap is gone whatever
 * its merits. `hue-rotate(180deg)` after the inversion is what answers the old
 * objection: inversion moves every hue half way round the wheel, and the
 * rotation moves it back, so parkland stays green and water stays blue while
 * the paper goes black. Roads and labels, being neutral, simply flip.
 *
 * Filtering our own tiles also means no third party can put a watermark, a
 * price, or a key on this map again.
 */
export const BASEMAPS: Record<Theme, Basemap> = {
  light: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap contributors",
  },
  dark: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap contributors",
    className: "basemap-dark",
  },
};

/** The filter that turns the light basemap into the dark one. */
export const DARK_BASEMAP_FILTER =
  "invert(1) hue-rotate(180deg) brightness(0.93) contrast(0.92) saturate(0.8)";

export const MAX_TILE_ZOOM = 19;
