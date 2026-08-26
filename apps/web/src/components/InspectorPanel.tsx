"use client";

import { useState } from "react";
import { pickNearestAvailable, haversineKm } from "@/lib/allocator-preview";
import type { Report, Resource } from "@/lib/useDashboardData";
import { AlertTriangleIcon, CheckIcon, CloseIcon } from "@/components/icons";

const SEVERITY_COLOR: Record<Report["severity"], string> = {
  low: "var(--text-muted)",
  medium: "var(--medium)",
  high: "var(--high)",
  critical: "var(--critical)",
};

interface Props {
  report: Report | null;
  resources: Resource[];
  allocating: boolean;
  onAllocate: (reportId: string) => void;
  onManualAssign: (reportId: string, resourceId: string) => void;
  onResolve: (reportId: string) => void;
  onReopen: (reportId: string) => void;
  onClose?: () => void;
}

export default function InspectorPanel({
  report,
  resources,
  allocating,
  onAllocate,
  onManualAssign,
  onResolve,
  onReopen,
  onClose,
}: Props) {
  const [manualPick, setManualPick] = useState("");

  if (!report) {
    return (
      <section className="flex flex-col h-full bg-panel border border-border rounded-2xl shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)] items-center justify-center px-4">
        <p className="text-sm text-text-muted text-center">
          Select a report from the queue or map to inspect it.
        </p>
      </section>
    );
  }

  const assignedResource = report.assigned_resource_id
    ? resources.find((r) => r.id === report.assigned_resource_id)
    : null;

  const nearest = pickNearestAvailable(report, resources);
  const nearestDistance = nearest ? haversineKm(report, nearest).toFixed(1) : null;
  const severityColor = SEVERITY_COLOR[report.severity];
  const availableResources = resources.filter((r) => r.status === "available" || r.id === report.assigned_resource_id);

  return (
    <section className="flex flex-col h-full bg-panel border border-border rounded-2xl shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)] overflow-y-auto">
      <div className="px-4 py-3.5 border-b border-border flex items-center justify-between">
        <span className="text-base font-semibold">Inspector</span>
        {onClose && (
          <button onClick={onClose} className="font-mono text-xs text-text-muted hover:text-text cursor-pointer">
            <CloseIcon size={16} />
          </button>
        )}
      </div>

      <div className="p-4 flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: severityColor, boxShadow: report.severity === "critical" ? `0 0 6px ${severityColor}` : "none" }}
            />
            <span className="font-mono text-xs font-bold tracking-wide uppercase" style={{ color: severityColor }}>
              {report.severity}
            </span>
          </div>
          <span className="font-mono text-xs font-semibold text-text-muted uppercase">{report.status}</span>
        </div>

        {report.cluster_size > 1 && (
          <div
            className="rounded-md p-3 text-sm border"
            style={{ background: "var(--panel-alt)", borderColor: "var(--critical)" }}
          >
            <div className="font-semibold flex items-center gap-1.5" style={{ color: "var(--critical)" }}>
              <AlertTriangleIcon size={15} /> Escalated — incident cluster
            </div>
            <div className="text-text-muted mt-1 text-xs leading-relaxed">
              {report.cluster_size} reports filed within 2 km in the last 30 minutes. Likely one developing
              incident, not isolated calls.
            </div>
          </div>
        )}

        {report.description && (
          <p className="text-sm bg-panel-alt p-3 rounded-md leading-relaxed">{report.description}</p>
        )}

        <span className="font-mono text-xs text-text-muted">
          {report.lat.toFixed(4)}°N · {report.lng.toFixed(4)}°E
        </span>

        {report.status === "open" && (
          <div className="bg-panel-alt rounded-md p-3.5 flex flex-col gap-2.5">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-text-muted">
              Nearest Available
            </span>
            {nearest ? (
              <div>
                <div className="text-sm font-semibold">{nearest.name}</div>
                <div className="font-mono text-xs text-text-muted mt-0.5">
                  {nearest.type.replace("_", " ")} · {nearestDistance} km
                  {nearest.capacity ? ` · capacity ${nearest.capacity}` : ""}
                </div>
              </div>
            ) : (
              <p className="text-sm text-text-muted">No available resource found.</p>
            )}
            <button
              onClick={() => onAllocate(report.id)}
              disabled={allocating || !nearest}
              className="w-full py-2.5 rounded text-sm font-bold tracking-wide uppercase disabled:opacity-50 cursor-pointer"
              style={{ background: "var(--accent)", color: "var(--accent-contrast)" }}>
              {allocating ? "Allocating…" : "Allocate Nearest Resource"}
            </button>
          </div>
        )}

        {report.status === "assigned" && assignedResource && (
          <div className="rounded-md p-3.5 text-sm border" style={{ background: "var(--panel-alt)", borderColor: "var(--assigned)" }}>
            <div className="font-semibold" style={{ color: "var(--assigned)" }}>Assigned to</div>
            <div className="mt-1">{assignedResource.name} ({assignedResource.type.replace("_", " ")})</div>
          </div>
        )}

        {report.status === "resolved" && (
          <div className="rounded-md p-3.5 text-sm border flex items-center justify-center gap-1.5" style={{ background: "var(--panel-alt)", borderColor: "var(--available)", color: "var(--available)" }}>
            <CheckIcon size={15} /> Resolved
          </div>
        )}

        {report.status !== "resolved" && (
          <div className="bg-panel-alt rounded-md p-3.5 flex flex-col gap-2.5">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-text-muted">
              Manual Override
            </span>
            <div className="flex gap-2">
              <select
                value={manualPick}
                onChange={(e) => setManualPick(e.target.value)}
                className="flex-1 bg-panel border border-border rounded px-2 py-2 text-sm outline-none"
              >
                <option value="">Reassign to…</option>
                {availableResources.map((r) => (
                  <option key={r.id} value={r.id}>{r.name} ({r.type.replace("_", " ")})</option>
                ))}
              </select>
              <button
                onClick={() => manualPick && onManualAssign(report.id, manualPick)}
                disabled={!manualPick}
                className="px-3 py-2 rounded text-xs font-bold uppercase disabled:opacity-40 cursor-pointer"
                style={{ background: "var(--assigned)", color: "var(--accent-contrast)" }}
              >
                Set
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onResolve(report.id)}
                className="flex-1 py-2 rounded text-xs font-bold uppercase cursor-pointer"
                style={{ background: "var(--available)", color: "var(--accent-contrast)" }}
              >
                Mark Resolved
              </button>
              {report.status === "assigned" && (
                <button
                  onClick={() => onReopen(report.id)}
                  className="flex-1 py-2 rounded text-xs font-bold uppercase cursor-pointer border border-border"
                >
                  Reopen
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
