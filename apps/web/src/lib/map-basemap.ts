import type { Theme } from "./useTheme";

export interface Basemap {
  url: string;
  attribution: string;
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
 * Light stays on plain OpenStreetMap tiles. Dark uses CARTO's dark basemap
 * rather than a CSS filter over the same tiles: inverting OSM turns its green
 * parkland magenta and its blue water orange, which is worse than no dark mode
 * at all. CARTO's is drawn dark, and it is drawn from the same OSM data, so
 * place names and roads stay identical between the two themes.
 *
 * Both require attribution, and Leaflet renders it in the corner from these
 * strings.
 */
export const BASEMAPS: Record<Theme, Basemap> = {
  light: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap contributors",
  },
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
  },
};

export const MAX_TILE_ZOOM = 19;
