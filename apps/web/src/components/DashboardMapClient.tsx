"use client";

// leaflet.css is imported globally (src/app/globals.css).
//
// Uses raw Leaflet (L.map + refs/effects) instead of react-leaflet's
// declarative <MapContainer> — see git history / project notes for why.
import L from "leaflet";
import { readMarkerPalette } from "@/lib/severity-colors";
import "leaflet.heat";
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
import type { Alert, Report, Resource } from "@/lib/useDashboardData";

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Marker glyphs as inline SVG paths, matching the app's drawn icon set
// (24x24 box, 1.75 stroke, round caps). Leaflet builds markers from HTML
// strings, so these can't reuse the React components in components/icons.tsx —
// but they must stay geometrically identical to them.
const PALETTE = readMarkerPalette();
const SEVERITY_COLOR = PALETTE.alert;
const REPORT_COLOR = PALETTE.report;
const RESOURCE_STATUS_COLOR = PALETTE.resource;

const RESOURCE_GLYPH: Record<Resource["type"], string> = {
  shelter: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.8V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.8"/>',
  rescue_team:
    '<path d="M3 7h11v9H3z"/><path d="M14 10h3.5l2.5 3v3H14z"/><circle cx="7" cy="18.5" r="1.8"/><circle cx="17" cy="18.5" r="1.8"/><path d="M8.5 10.5h3M10 9v3"/>',
  supply_stock:
    '<path d="M3 8.5 12 4l9 4.5v7L12 20l-9-4.5z"/><path d="M3 8.5 12 13l9-4.5M12 13v7"/>',
};

function svgGlyph(paths: string) {
  return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white"
    stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
}

function resourceIcon(resource: Resource) {
  return L.divIcon({
    html: `<div style="
      background:${RESOURCE_STATUS_COLOR[resource.status]};
      width:28px;height:28px;border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4);
">${svgGlyph(RESOURCE_GLYPH[resource.type])}</div>`,
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

// Alerts are nationwide (SACHET covers all of India); start zoomed out to
// the whole country rather than assuming the Chennai demo region, and let
// the authority zoom in themselves.
const DEFAULT_CENTER: [number, number] = [22.9734, 78.6569];
const DEFAULT_ZOOM = 5;

/**
 * A pane for the vector layers, above the heatmap.
 *
 * leaflet.heat hardcodes its canvas into `overlayPane` — the same pane Leaflet
 * draws vectors into — and it is added after them on every redraw, so its canvas
 * ended up on top of the dispatch lines, cluster halos and report markers and
 * buried them. The density heatmap is a backdrop; everything drawn to be read
 * belongs above it.
 */
const VECTOR_PANE = "vectors";

interface Props {
  alerts: Alert[];
  resources: Resource[];
  reports: Report[];
  selectedReportId: string | null;
  onSelectReport: (id: string) => void;
}

export default function DashboardMapClient({
  alerts,
  resources,
  reports,
  selectedReportId,
  onSelectReport,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const heatLayerRef = useRef<L.Layer | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const facilityGroupRef = useRef<L.LayerGroup | null>(null);

  const theme = useThemeName();
  const [kinds, setKinds] = useState<Set<FacilityKind>>(new Set());
  // Bumped when a newly fetched cell lands, which re-runs the redraw below.
  const [cellsLoaded, setCellsLoaded] = useState(0);
  const [note, setNote] = useState<string | null>(null);

  // 1. Initialize the map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    });
    // The tile layer is added by the theme effect below rather than here, so
    // there is one place that decides which basemap is on the map.

    // Between overlayPane (400, where the heatmap canvas lands) and shadowPane
    // (500), so vectors sit above the heat without disturbing marker order.
    map.createPane(VECTOR_PANE);
    const vectorPane = map.getPane(VECTOR_PANE);
    if (vectorPane) vectorPane.style.zIndex = "450";

    layerGroupRef.current = L.layerGroup().addTo(map);
    // Its own group so redrawing incidents on every poll does not wipe the
    // facilities, and panning does not redraw the incidents.
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
  }, []);

  // 1b. Swap the basemap when the theme changes.
  //
  // Leaflet holds the tiles imperatively, so nothing about a React re-render
  // reaches them: without this the console goes dark around a map that stays in
  // full daylight.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const basemap = BASEMAPS[theme];
    const next = L.tileLayer(basemap.url, {
      attribution: basemap.attribution,
      maxZoom: MAX_TILE_ZOOM,
      className: basemap.className,
    });
    // Added before the old one is removed: dropping the only tile layer first
    // flashes the empty background through the whole map for a frame.
    next.addTo(map);
    const previous = tileLayerRef.current;
    tileLayerRef.current = next;
    if (previous) map.removeLayer(previous);
  }, [theme]);

  // 2. Redraw markers/heatmap whenever data changes.
  useEffect(() => {
    const map = mapRef.current;
    const group = layerGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    const resourceById = new Map(resources.map((r) => [r.id, r]));

    for (const a of alerts) {
      L.circleMarker([a.lat, a.lng], {
        pane: VECTOR_PANE,
        radius: 9,
        color: "white",
        weight: 2,
        fillColor: SEVERITY_COLOR[a.severity_color],
        fillOpacity: 0.9,
      })
        .bindPopup(
          `<b>${a.disaster_type}</b>` +
            (a.area_description ? `<div>${a.area_description}</div>` : "") +
            (a.warning_message ? `<div style="margin-top:4px">${a.warning_message}</div>` : "")
        )
        .addTo(group);
    }

    for (const r of resources) {
      L.marker([r.lat, r.lng], { icon: resourceIcon(r) })
        .bindPopup(
          `<b>${r.name}</b><div>${r.type.replace("_", " ")} — ${r.status}</div>` +
            (r.capacity ? `<div>capacity: ${r.capacity}</div>` : "")
        )
        .addTo(group);
    }

    for (const rep of reports) {
      if (rep.status === "assigned" && rep.assigned_resource_id) {
        const resource = resourceById.get(rep.assigned_resource_id);
        if (resource) {
          // Marching-ants dash (animated in globals.css) so an active dispatch
          // reads as movement toward the report, not a static connector.
          L.polyline(
            [
              [rep.lat, rep.lng],
              [resource.lat, resource.lng],
            ],
            {
              pane: VECTOR_PANE,
              color: PALETTE.dispatch,
              weight: 2.5,
              dashArray: "8 8",
              className: "dispatch-line",
            }
          ).addTo(group);
        }
      }

      // A report that is part of a multi-report cluster gets a halo, so a
      // developing incident is visible on the map at a glance.
      if (rep.cluster_size > 1 && rep.status !== "resolved") {
        L.circleMarker([rep.lat, rep.lng], {
          pane: VECTOR_PANE,
          radius: 20,
          color: REPORT_COLOR.critical,
          weight: 2,
          opacity: 0.7,
          fill: false,
          dashArray: "4 4",
          className: "cluster-halo",
        }).addTo(group);
      }

      const isSelected = rep.id === selectedReportId;
      const marker = L.circleMarker([rep.lat, rep.lng], {
        pane: VECTOR_PANE,
        radius: isSelected ? 11 : 8,
        color: isSelected ? PALETTE.dispatch : PALETTE.outline,
        weight: isSelected ? 3 : 1,
        fillColor: REPORT_COLOR[rep.severity],
        fillOpacity: 0.95,
      });

      marker.on("click", () => onSelectReport(rep.id));

      const assignedName =
        rep.status === "assigned" && rep.assigned_resource_id
          ? resourceById.get(rep.assigned_resource_id)?.name
          : null;
      marker.bindTooltip(
        `${rep.severity} — ${rep.status}` + (assignedName ? ` → ${assignedName}` : "")
      );

      marker.addTo(group);
    }

    if (reports.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const heat = (L as any).heatLayer(
        reports.map((r) => [r.lat, r.lng, 0.6]),
        { radius: 30, blur: 25, maxZoom: 14 }
      );
      heat.addTo(map);
      heatLayerRef.current = heat;
    }
  }, [alerts, resources, reports, selectedReportId, onSelectReport]);


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

    // Read fresh rather than captured: this also runs on pan, and the theme may
    // have changed since the last draw.
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

  // 3. Bring the selected report into view, with its assigned resource.
  //
  // The console opens at zoom 5 to show the whole country, where a dispatch to a
  // nearby unit — 5 km, the good case — is under two pixels long and reads as
  // nothing at all. Selecting a report frames the report and the unit sent to
  // it, so the dispatch is actually legible. Only on a change of selection, so
  // the operator's own panning survives the next poll.
  const framedRef = useRef<string | null>(null);
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (selectedReportId === framedRef.current) return;
    framedRef.current = selectedReportId;
    if (!selectedReportId) return;

    const report = reports.find((r) => r.id === selectedReportId);
    if (!report) return;

    const resource =
      report.status === "assigned" && report.assigned_resource_id
        ? resources.find((r) => r.id === report.assigned_resource_id)
        : undefined;

    if (resource) {
      map.fitBounds(
        [
          [report.lat, report.lng],
          [resource.lat, resource.lng],
        ],
        { padding: [64, 64], maxZoom: 13, animate: true }
      );
    } else {
      map.setView([report.lat, report.lng], Math.max(map.getZoom(), 11), { animate: true });
    }
  }, [selectedReportId, reports, resources]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} style={{ height: "100%", width: "100%" }} />
      <MapFacilityControl kinds={kinds} onToggle={toggleKind} note={note} />
    </div>
  );
}
