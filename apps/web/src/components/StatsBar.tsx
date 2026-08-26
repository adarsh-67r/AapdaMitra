import type { Alert, Report, Resource } from "@/lib/useDashboardData";

interface Props {
  alerts: Alert[];
  resources: Resource[];
  reports: Report[];
}

const SEGMENTS = 16;

function TickBar({ fraction, color }: { fraction: number; color: string }) {
  const filled = Math.round(fraction * SEGMENTS);
  return (
    <div className="flex gap-[3px]">
      {Array.from({ length: SEGMENTS }).map((_, i) => (
        <div
          key={i}
          className="w-2 h-3 rounded-[1px]"
          style={{ background: i < filled ? color : "var(--panel-alt)" }}
        />
      ))}
    </div>
  );
}

function RadialGauge({ value, total }: { value: number; total: number }) {
  const r = 36;
  const circumference = 2 * Math.PI * r;
  const fraction = total === 0 ? 0 : value / total;
  const dash = circumference * fraction;

  return (
    <svg width="72" height="72" viewBox="0 0 88 88">
      <circle cx="44" cy="44" r={r} fill="none" stroke="var(--panel-alt)" strokeWidth="8" />
      <circle
        cx="44"
        cy="44"
        r={r}
        fill="none"
        stroke="var(--critical)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circumference}`}
        transform="rotate(-90 44 44)"
      />
      <text x="44" y="51" textAnchor="middle" className="font-mono" style={{ fontSize: 24, fontWeight: 700, fill: "var(--text)" }}>
        {value}
      </text>
    </svg>
  );
}

export default function StatsBar({ alerts, resources, reports }: Props) {
  const criticalOpen = reports.filter((r) => r.status === "open" && r.severity === "critical").length;
  const openReports = reports.filter((r) => r.status === "open").length;
  const availableResources = resources.filter((r) => r.status === "available").length;
  const severeAlerts = alerts.filter((a) => a.severity_color === "orange" || a.severity_color === "red").length;
  const assigned = reports.filter((r) => r.status === "assigned").length;
  const resolved = reports.filter((r) => r.status === "resolved").length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 px-7 pt-4 pb-3">
      <div className="rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 px-5 py-4 flex items-center gap-4">
        <RadialGauge value={criticalOpen} total={Math.max(openReports, 1)} />
        <div>
          <div className="font-mono text-xs uppercase tracking-wider text-text-muted">Critical / Open</div>
          <div className="text-base font-semibold mt-1">{criticalOpen} of {openReports} reports</div>
          <div className="text-sm text-critical mt-0.5">Immediate action</div>
        </div>
      </div>

      <div className="rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 px-5 py-4 flex flex-col justify-center gap-2.5">
        <span className="font-mono text-xs uppercase tracking-wider text-text-muted">Resources Available</span>
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-[26px] font-bold text-available">
            {String(availableResources).padStart(2, "0")}
          </span>
          <span className="font-mono text-sm text-text-muted">/ {resources.length}</span>
        </div>
        <TickBar fraction={resources.length ? availableResources / resources.length : 0} color="var(--available)" />
      </div>

      <div className="rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 px-5 py-4 flex flex-col justify-center gap-2.5">
        <span className="font-mono text-xs uppercase tracking-wider text-text-muted">Severe Alerts</span>
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-[26px] font-bold text-high">
            {String(severeAlerts).padStart(2, "0")}
          </span>
          <span className="font-mono text-sm text-text-muted">/ {alerts.length} active</span>
        </div>
        <TickBar fraction={alerts.length ? severeAlerts / alerts.length : 0} color="var(--high)" />
      </div>

      <div className="rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 px-5 py-4 flex flex-col justify-center gap-2.5">
        <span className="font-mono text-xs uppercase tracking-wider text-text-muted">Assigned / Resolved</span>
        <div className="flex items-baseline gap-2 font-mono">
          <span className="text-[26px] font-bold text-assigned">{assigned}</span>
          <span className="text-sm text-text-muted">assigned ·</span>
          <span className="text-xl font-bold text-available">{resolved}</span>
          <span className="text-sm text-text-muted">resolved</span>
        </div>
      </div>
    </div>
  );
}
