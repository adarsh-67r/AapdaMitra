import L from "leaflet";

import type { Facility, FacilityKind } from "./facilities";

/**
 * Drawn to the same rules as the resource glyphs in the map clients: a 24×24
 * box, 1.75 stroke, round caps. They have to be HTML strings because Leaflet
 * builds markers from markup, not from React.
 */
const GLYPH: Record<FacilityKind, string> = {
  hospital: '<path d="M12 7v10M7 12h10"/>',
  police: '<path d="M12 3.5 19 6v5.5c0 4-2.9 6.6-7 8.5-4.1-1.9-7-4.5-7-8.5V6z"/>',
  fire: '<path d="M12 3.5c.6 2.4 2 3.4 3.1 4.8A6.3 6.3 0 0 1 16.6 12a4.6 4.6 0 0 1-9.2 0c0-1.4.5-2.3 1.2-3.1.2 1 .8 1.7 1.5 2 .1-2.9.9-5.2 1.9-7.4z"/>',
};

const KIND_NOUN: Record<FacilityKind, string> = {
  hospital: "Hospital",
  police: "Police station",
  fire: "Fire station",
};

/**
 * Facilities are context, not signal.
 *
 * Every one of these is drawn in the same muted ink and separated by its glyph
 * rather than by colour. Giving fire stations red would spend the one colour
 * this interface reserves for a critical incident on a building that is not on
 * fire — and a map where the static furniture is as loud as the emergency is a
 * map nobody can read under pressure.
 */
export function facilityIcon(kind: FacilityKind, color: string): L.DivIcon {
  return L.divIcon({
    html: `<div style="
      background:${color};
      width:20px;height:20px;border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      border:1.5px solid rgba(255,255,255,.85);opacity:.9;
"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white"
      stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${GLYPH[kind]}</svg></div>`,
    className: "",
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

/** Replaces whatever the group held with markers for `list`. */
export function drawFacilities(
  group: L.LayerGroup,
  list: Facility[],
  color: string,
  pane?: string
): void {
  group.clearLayers();
  for (const f of list) {
    L.marker([f.lat, f.lng], { icon: facilityIcon(f.kind, color), pane })
      .bindTooltip(`${f.name}<br><span style="opacity:.7">${KIND_NOUN[f.kind]}</span>`)
      .addTo(group);
  }
}
