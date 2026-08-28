"use client";

import { useState } from "react";
import type { Report } from "@/lib/useDashboardData";
import { AlertTriangleIcon } from "@/components/icons";

const SEVERITY_COLOR: Record<Report["severity"], string> = {
  low: "var(--text-muted)",
  medium: "var(--medium)",
  high: "var(--high)",
  critical: "var(--critical)",
};

const STATUS_COLOR: Record<Report["status"], string> = {
  open: "var(--high)",
  assigned: "var(--assigned)",
  resolved: "var(--available)",
};

const FILTERS: { id: "all" | Report["status"]; label: string }[] = [
  { id: "all", label: "ALL" },
  { id: "open", label: "OPEN" },
  { id: "resolved", label: "DONE" },
];

interface Props {
  reports: Report[];
  selectedReportId: string | null;
  onSelectReport: (id: string) => void;
}

export default function ReportsQueue({ reports, selectedReportId, onSelectReport }: Props) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");

  const filtered = filter === "all" ? reports : reports.filter((r) => r.status === filter);

  return (
    <section className="flex flex-col h-full bg-panel border border-border rounded-sm overflow-hidden">
      <div className="px-4 py-3.5 border-b border-border flex items-center justify-between">
        <span className="text-base font-semibold">Report Queue</span>
        <span className="font-mono text-xs text-text-muted">{String(filtered.length).padStart(3, "0")}</span>
      </div>

      <div className="flex gap-4 px-4 py-3 border-b border-border">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className="font-mono text-xs pb-2 cursor-pointer transition-transform duration-[120ms] ease-out active:scale-[0.96]"
            style={{
              color: filter === f.id ? "var(--text)" : "var(--text-muted)",
              fontWeight: filter === f.id ? 600 : 400,
              borderBottom: filter === f.id ? "2px solid var(--accent)" : "2px solid transparent",
            }}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-px bg-panel-alt">
        {filtered.length === 0 ? (
          <div className="text-center text-sm text-text-muted py-10">No reports.</div>
        ) : (
          filtered.map((r) => {
            const severityColor = SEVERITY_COLOR[r.severity];
            const statusColor = STATUS_COLOR[r.status];
            return (
              <button
                key={r.id}
                onClick={() => onSelectReport(r.id)}
                className="text-left bg-panel px-4 py-3 flex flex-col gap-2 cursor-pointer transition-colors duration-[120ms] hover:bg-panel active:bg-panel"
                style={{
                  borderLeft: `3px dashed ${severityColor}`,
                  opacity: r.status === "resolved" ? 0.6 : 1,
                  outline: selectedReportId === r.id ? "1px solid var(--accent)" : "none",
                  outlineOffset: "-1px",
                }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: severityColor, boxShadow: r.severity === "critical" ? `0 0 5px ${severityColor}` : "none" }}
                    />
                    <span className="font-mono text-xs font-bold tracking-wide uppercase" style={{ color: severityColor }}>
                      {r.severity}
                    </span>
                  </div>
                  <span className="font-mono text-xs font-semibold uppercase" style={{ color: statusColor }}>
                    {r.status}
                  </span>
                </div>
                {r.cluster_size > 1 && (
                  <span
                    className="font-mono text-[0.65rem] font-bold self-start px-2 py-0.5 inline-flex items-center gap-1"
                    style={{ background: "var(--critical)", color: "#fff" }}
                  >
                    <AlertTriangleIcon size={12} /> CLUSTER · {r.cluster_size} REPORTS NEARBY
                  </span>
                )}
                {r.place_label && (
                  <span className="text-sm font-medium leading-snug flex items-baseline gap-1.5">
                    {r.place_label}
                    {r.location_source === "manual" && (
                      <span className="font-mono text-[0.6rem] text-text-muted uppercase shrink-0">
                        approx
                      </span>
                    )}
                  </span>
                )}
                {/* An operator triaging the queue should be able to see which
                    reports carry first-hand evidence before opening them. */}
                {r.photo_url && (
                  <span className="font-mono text-[0.6rem] tracking-[0.12em] text-text-muted uppercase">
                    Photo attached
                  </span>
                )}

                {r.description && (
                  <p className="text-sm text-text-muted leading-snug line-clamp-2">{r.description}</p>
                )}
                <span className="font-mono text-xs text-text-muted">
                  {new Date(r.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}
                </span>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}
