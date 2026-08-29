export interface MapPin {
  lat: number;
  lng: number;
  color: string;
  title: string;
  description: string;
}

export interface MapChrome {
  /** Follows the device colour scheme, the same way the rest of the app does. */
  dark: boolean;
  /** Panel, border and text colours, so popups match the app around them. */
  panel: string;
  border: string;
  text: string;
  ground: string;
  /** The ink facilities are drawn in — see the note on setFacilities. */
  muted: string;
}

/** What the map posts back to React Native whenever the view settles. */
export interface MapView {
  south: number;
  west: number;
  north: number;
  east: number;
  zoom: number;
}

/** A facility as the API returns it, and as setFacilities expects it. */
export interface MapFacility {
  kind: "hospital" | "police" | "fire";
  lat: number;
  lng: number;
  name: string;
}

/**
 * The tiles under everything else, matched to the two web basemaps.
 *
 * Both themes draw plain OpenStreetMap tiles; dark filters them in the WebView.
 * This was CARTO's ready-made dark basemap until CARTO began stamping API KEY
 * REQUIRED across every tile of the keyless endpoint. A plain `invert(1)` is
 * what the old comment here rightly refused — it turns parkland magenta and
 * water orange — but inversion moves every hue half way round the wheel, and
 * `hue-rotate(180deg)` moves it back, so the colours survive and only the paper
 * goes black.
 */
const OSM = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTRIBUTION = "&copy; OpenStreetMap contributors";

/** Said in the popup, so one muted ink can serve all three kinds. */
const FACILITY_NOUN = {
  hospital: "Hospital",
  police: "Police station",
  fire: "Fire station",
};

/** Applied to Leaflet's tile pane only, so the pins on top keep their colour. */
const DARK_FILTER = "invert(1) hue-rotate(180deg) brightness(0.93) contrast(0.92) saturate(0.8)";

// A self-contained Leaflet map for react-native-webview. Loads Leaflet from
// unpkg (needs internet — same requirement the app already has for
// Supabase) instead of react-native-maps, which needs a paid-tier-adjacent
// Google Maps API key for Android production builds. No key, no billing
// setup, same OSM tiles the console uses.
export function leafletHtml(
  center: { lat: number; lng: number },
  pins: MapPin[],
  chrome: MapChrome
): string {
  const darkTiles = chrome.dark ? `.leaflet-tile-pane { filter: ${DARK_FILTER}; }` : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; }
    #map { background: ${chrome.ground}; }
    ${darkTiles}
    /* Leaflet's own chrome ships white and stays white. Against the dark
       basemap those become the brightest things on the screen, so they are put
       on the app's own surfaces. */
    .leaflet-popup-content-wrapper,
    .leaflet-popup-tip {
      background: ${chrome.panel};
      color: ${chrome.text};
      border: 1px solid ${chrome.border};
      border-radius: 2px;
    }
    .leaflet-bar a, .leaflet-bar a:hover {
      background: ${chrome.panel};
      color: ${chrome.text};
      border-bottom-color: ${chrome.border};
    }
    .leaflet-control-attribution {
      background: ${chrome.panel};
      color: ${chrome.text};
    }
    .leaflet-control-attribution a { color: ${chrome.text}; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const map = L.map('map').setView([${center.lat}, ${center.lng}], 11);
    L.tileLayer('${OSM}', {
      attribution: '${OSM_ATTRIBUTION}'
    }).addTo(map);

    const pins = ${JSON.stringify(pins)};
    pins.forEach(function (p) {
      L.circleMarker([p.lat, p.lng], {
        radius: 9,
        color: '${chrome.panel}',
        weight: 2,
        fillColor: p.color,
        fillOpacity: 1
      })
        .addTo(map)
        .bindPopup('<b>' + p.title + '</b><br/>' + p.description);
    });

    // Hospitals, police and fire stations, put on the map by React Native
    // rather than baked into this document: the HTML is rebuilt whenever the
    // shelters poll returns something new, and a rebuild reloads the WebView.
    // Anything drawn through here survives a toggle without the map jumping
    // back to where it started.
    var facilityLayer = L.layerGroup().addTo(map);

    var FACILITY_NOUN = {
      hospital: '${FACILITY_NOUN.hospital}',
      police: '${FACILITY_NOUN.police}',
      fire: '${FACILITY_NOUN.fire}'
    };

    // Drawn small, hollow and in one muted ink, separated by the word in the
    // popup rather than by colour. Giving fire stations red would spend the one
    // colour this map reserves for an emergency on a building that is not on
    // fire.
    window.setFacilities = function (list) {
      facilityLayer.clearLayers();
      list.forEach(function (f) {
        L.circleMarker([f.lat, f.lng], {
          radius: 5,
          color: '${chrome.muted}',
          weight: 2,
          fillColor: '${chrome.ground}',
          fillOpacity: 1
        })
          .addTo(facilityLayer)
          .bindPopup('<b>' + f.name + '</b><br/>' + (FACILITY_NOUN[f.kind] || ''));
      });
    };

    // React Native decides what to fetch, so it needs to know what is on
    // screen. Sent once the map has settled rather than during the gesture:
    // a pan fires this at the end, not for every frame of it.
    function postView() {
      if (!window.ReactNativeWebView) return;
      var b = map.getBounds();
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'view',
        south: b.getSouth(),
        west: b.getWest(),
        north: b.getNorth(),
        east: b.getEast(),
        zoom: map.getZoom()
      }));
    }

    map.on('moveend', postView);
    postView();
  </script>
</body>
</html>`;
}
