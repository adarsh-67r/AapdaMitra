"use client";

// leaflet.css is imported globally (src/app/globals.css).
//
// Uses raw Leaflet (L.map + refs/effects) instead of react-leaflet's
// declarative <MapContainer> — see git history / project notes for why.
import L from "leaflet";
import "leaflet.heat";
import { useEffect, useRef } from "react";
import type { Alert, Report, Resource } from "@/lib/useDashboardData";

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const SEVERITY_COLOR: Record<Alert["severity_color"], string> = {
  green: "#2E9E4A",
  yellow: "#D8B400",
  orange: "#E08A00",
  red: "#D64545",
};

const REPORT_COLOR: Record<Report["severity"], string> = {
  low: "#4C9F4C",
  medium: "#D8B400",
  high: "#E08A00",
  critical: "#D64545",
};

// Marker glyphs as inline SVG paths, matching the app's drawn icon set
// (24x24 box, 1.75 stroke, round caps). Leaflet builds markers from HTML
// strings, so these can't reuse the React components in components/icons.tsx —
// but they must stay geometrically identical to them.
const RESOURCE_GLYPH: Record<Resource["type"], string> = {
  shelter: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.8V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.8"/>',
  rescue_team:
    '<path d="M3 7h11v9H3z"/><path d="M14 10h3.5l2.5 3v3H14z"/><circle cx="7" cy="18.5" r="1.8"/><circle cx="17" cy="18.5" r="1.8"/><path d="M8.5 10.5h3M10 9v3"/>',
  supply_stock:
    '<path d="M3 8.5 12 4l9 4.5v7L12 20l-9-4.5z"/><path d="M3 8.5 12 13l9-4.5M12 13v7"/>',
};

const RESOURCE_STATUS_COLOR: Record<Resource["status"], string> = {
  available: "#2E9E4A",
  full: "#D64545",
  dispatched: "#E08A00",
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

  // 1. Initialize the map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    });
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
      layerGroupRef.current = null;
    };
  }, []);

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
            { color: "#208AEF", weight: 2.5, dashArray: "8 8", className: "dispatch-line" }
          ).addTo(group);
        }
      }

      // A report that is part of a multi-report cluster gets a halo, so a
      // developing incident is visible on the map at a glance.
      if (rep.cluster_size > 1 && rep.status !== "resolved") {
        L.circleMarker([rep.lat, rep.lng], {
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
        radius: isSelected ? 11 : 8,
        color: isSelected ? "#208AEF" : "black",
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

  return <div ref={containerRef} style={{ height: "100%", width: "100%" }} />;
}
