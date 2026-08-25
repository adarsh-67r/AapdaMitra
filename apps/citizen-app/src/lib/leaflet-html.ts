export interface MapPin {
  lat: number;
  lng: number;
  color: string;
  title: string;
  description: string;
}

// A self-contained Leaflet map for react-native-webview. Loads Leaflet from
// unpkg (needs internet — same requirement the app already has for
// Supabase) instead of react-native-maps, which needs a paid-tier-adjacent
// Google Maps API key for Android production builds. No key, no billing
// setup, same OSM tiles the dashboard uses.
export function leafletHtml(center: { lat: number; lng: number }, pins: MapPin[]): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const map = L.map('map').setView([${center.lat}, ${center.lng}], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const pins = ${JSON.stringify(pins)};
    pins.forEach(function (p) {
      L.circleMarker([p.lat, p.lng], {
        radius: 9,
        color: '#ffffff',
        weight: 2,
        fillColor: p.color,
        fillOpacity: 1
      })
        .addTo(map)
        .bindPopup('<b>' + p.title + '</b><br/>' + p.description);
    });
  </script>
</body>
</html>`;
}
