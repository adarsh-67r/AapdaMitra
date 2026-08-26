"use client";

import L from "leaflet";
import { useEffect, useRef } from "react";

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export interface MapPin {
  lat: number;
  lng: number;
  color: string;
  title: string;
  description: string;
}

const DEFAULT_CENTER: [number, number] = [13.0674, 80.2376]; // Chennai — demo region

export default function CitizenMapClient({
  pins,
  center,
  zoom,
}: {
  pins: MapPin[];
  center?: [number, number];
  zoom?: number;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { center: center ?? DEFAULT_CENTER, zoom: zoom ?? 12 });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);
    layerGroupRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    const resizeObserver = new ResizeObserver(() => map.invalidateSize());
    resizeObserver.observe(containerRef.current);
    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const group = layerGroupRef.current;
    if (!group) return;
    group.clearLayers();
    for (const p of pins) {
      L.circleMarker([p.lat, p.lng], {
        radius: 9,
        color: "white",
        weight: 2,
        fillColor: p.color,
        fillOpacity: 0.9,
      })
        .bindPopup(`<b>${p.title}</b><div>${p.description}</div>`)
        .addTo(group);
    }
  }, [pins]);

  return <div ref={containerRef} style={{ height: "100%", width: "100%" }} />;
}
