"use client";

import L from "leaflet";
import { useCallback, useEffect, useRef, useState } from "react";

import MapFacilityControl from "@/components/MapFacilityControl";
import {
  FACILITY_MIN_ZOOM,
  cachedFacilitiesFor,
  facilitiesInView,
  loadFacilitiesFor,
  type FacilityKind,
} from "@/lib/facilities";
import { drawFacilities } from "@/lib/facility-markers";
import { BASEMAPS, MAX_TILE_ZOOM } from "@/lib/map-basemap";
import { useThemeName } from "@/lib/useTheme";

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
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const facilityGroupRef = useRef<L.LayerGroup | null>(null);

  const theme = useThemeName();
  const [kinds, setKinds] = useState<Set<FacilityKind>>(new Set());
  // Bumped when a newly fetched cell lands, which re-runs the redraw below.
  const [cellsLoaded, setCellsLoaded] = useState(0);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { center: center ?? DEFAULT_CENTER, zoom: zoom ?? 12 });
    // Tiles are added by the theme effect below, so one place decides which
    // basemap is on the map.
    layerGroupRef.current = L.layerGroup().addTo(map);
    facilityGroupRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    const resizeObserver = new ResizeObserver(() => map.invalidateSize());
    resizeObserver.observe(containerRef.current);
    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
      layerGroupRef.current = null;
      facilityGroupRef.current = null;
      tileLayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Leaflet holds its tiles imperatively, so a theme change has to be pushed to
  // them: otherwise the page goes dark around a map that stays in daylight.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const basemap = BASEMAPS[theme];
    const next = L.tileLayer(basemap.url, {
      attribution: basemap.attribution,
      maxZoom: MAX_TILE_ZOOM,
      className: basemap.className,
    });
    // Added before the old one is removed, so the background never shows
    // through for a frame.
    next.addTo(map);
    const previous = tileLayerRef.current;
    tileLayerRef.current = next;
    if (previous) map.removeLayer(previous);
  }, [theme]);

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


  const redrawFacilities = useCallback(() => {
    const map = mapRef.current;
    const group = facilityGroupRef.current;
    if (!map || !group) return;

    if (kinds.size === 0) {
      group.clearLayers();
      setNote(null);
      return;
    }

    if (map.getZoom() < FACILITY_MIN_ZOOM) {
      group.clearLayers();
      setNote("Zoom in to show facilities.");
      return;
    }

    const b = map.getBounds();
    const bounds = {
      south: b.getSouth(),
      west: b.getWest(),
      north: b.getNorth(),
      east: b.getEast(),
    };

    // Re-created whenever a cell arrives, so a redraw that had to wait runs
    // again with the data in hand.
    void cellsLoaded;

    const here = cachedFacilitiesFor(bounds);
    if (!here) {
      setNote("Loading facilities…");
      loadFacilitiesFor(bounds)
        .then(() => setCellsLoaded((n) => n + 1))
        .catch((e: unknown) => {
          // The layer is context, not the job. Say why it is missing and leave
          // the incident map working.
          setNote(e instanceof Error ? e.message : "Facility data unavailable.");
        });
      return;
    }

    const { shown, total } = facilitiesInView(here, bounds, kinds);

    const muted =
      getComputedStyle(document.documentElement).getPropertyValue("--text-muted").trim() ||
      "#6d6759";
    drawFacilities(group, shown, muted);

    setNote(
      total === 0
        ? "None of the selected kinds are in this view."
        : shown.length < total
          ? `Showing ${shown.length} of ${total} in view — zoom in for the rest.`
          : `${total} in view.`
    );
  }, [cellsLoaded, kinds]);

  useEffect(() => {
    redrawFacilities();
    const map = mapRef.current;
    if (!map) return;
    map.on("moveend", redrawFacilities);
    return () => {
      map.off("moveend", redrawFacilities);
    };
  }, [redrawFacilities]);

  const toggleKind = useCallback((kind: FacilityKind) => {
    setKinds((previous) => {
      const next = new Set(previous);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next;
    });
  }, []);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} style={{ height: "100%", width: "100%" }} />
      <MapFacilityControl kinds={kinds} onToggle={toggleKind} note={note} />
    </div>
  );
}
