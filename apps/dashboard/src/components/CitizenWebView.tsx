"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import CitizenMap from "@/components/CitizenMap";
import ThemeToggle from "@/components/ThemeToggle";
import { supabase } from "@/lib/supabase-client";
import { haversineKm } from "@/lib/geo";
import type { MapPin } from "@/components/CitizenMapClient";

type Tab = "report" | "alerts" | "shelters" | "mine" | "emergency";

const TABS: { id: Tab; label: string }[] = [
  { id: "report", label: "Report" },
  { id: "alerts", label: "Alerts" },
  { id: "shelters", label: "Shelters" },
  { id: "mine", label: "My Reports" },
  { id: "emergency", label: "Emergency" },
];

const SEVERITIES = ["low", "medium", "high", "critical"] as const;
type Severity = (typeof SEVERITIES)[number];

const EMERGENCY_CONTACTS = [
  { name: "National Emergency Number", number: "112" },
  { name: "Police", number: "100" },
  { name: "Fire", number: "101" },
  { name: "Ambulance", number: "102" },
  { name: "NDMA Disaster Management Helpline", number: "1070" },
  { name: "Women's Helpline", number: "1091" },
];

interface AlertRow {
  id: string;
  disaster_type: string;
  area_description: string | null;
  severity_color: "green" | "yellow" | "orange" | "red";
  warning_message: string | null;
  lat: number;
  lng: number;
}

interface ResourceRow {
  id: string;
  type: "shelter" | "rescue_team" | "supply_stock";
  name: string;
  lat: number;
  lng: number;
  status: "available" | "full" | "dispatched";
}

interface ReportRow {
  id: string;
  severity: Severity;
  description: string | null;
  status: "open" | "assigned" | "resolved";
  created_at: string;
}

const SEVERITY_COLOR: Record<AlertRow["severity_color"], string> = {
  green: "#2E9E4A", yellow: "#D8B400", orange: "#E08A00", red: "#D64545",
};

export default function CitizenWebView({ session, onSignOut }: { session: Session; onSignOut: () => void }) {
  const [tab, setTab] = useState<Tab>("report");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [severity, setSeverity] = useState<Severity>("medium");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [resources, setResources] = useState<ResourceRow[]>([]);
  const [myReports, setMyReports] = useState<ReportRow[]>([]);

  const loadAlerts = useCallback(async () => {
    const { data } = await supabase
      .from("alerts")
      .select("id, disaster_type, area_description, severity_color, warning_message, lat, lng")
      .order("fetched_at", { ascending: false })
      .limit(200);
    if (data) setAlerts(data as AlertRow[]);
  }, []);

  const loadResources = useCallback(async () => {
    const { data } = await supabase.from("resources").select("id, type, name, lat, lng, status");
    if (data) setResources(data as ResourceRow[]);
  }, []);

  const loadMyReports = useCallback(async () => {
    const { data } = await supabase
      .from("reports")
      .select("id, severity, description, status, created_at")
      .eq("citizen_id", session.user.id)
      .order("created_at", { ascending: false });
    if (data) setMyReports(data as ReportRow[]);
  }, [session.user.id]);

  useEffect(() => {
    loadAlerts();
    loadResources();
    loadMyReports();
    const channel = supabase
      .channel("citizen-web-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "alerts" }, loadAlerts)
      .on("postgres_changes", { event: "*", schema: "public", table: "resources" }, loadResources)
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, loadMyReports)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadAlerts, loadResources, loadMyReports]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    );
  }, []);

  const nearbyAlerts = useMemo(() => {
    if (!location) return alerts;
    return alerts.filter((a) => haversineKm(location, a) <= 150);
  }, [alerts, location]);

  const resourcePins: MapPin[] = useMemo(
    () =>
      resources.map((r) => ({
        lat: r.lat,
        lng: r.lng,
        color: r.status === "available" ? "#2E9E4A" : r.status === "full" ? "#D64545" : "#E08A00",
        title: r.name,
        description: `${r.type.replace("_", " ")} — ${r.status}`,
      })),
    [resources]
  );

  async function submitReport(overrideSeverity?: Severity, overrideDescription?: string) {
    if (!location) {
      alert("Location not available yet — allow location access and try again.");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("reports").insert({
        citizen_id: session.user.id,
        lat: location.lat,
        lng: location.lng,
        severity: overrideSeverity ?? severity,
        description: overrideDescription ?? description,
      });
      if (error) {
        alert(`Submission failed: ${error.message}`);
        return;
      }
      setDescription("");
      setSeverity("medium");
      alert("Report submitted. Authorities have been notified.");
      loadMyReports();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col h-screen bg-bg text-text">
      <header className="flex items-center justify-between px-6 py-3.5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 border border-accent rounded-md flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12h4l2-7 4 14 2-7h6" />
            </svg>
          </div>
          <span className="text-base font-bold tracking-tight">AapdaMitra</span>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <button onClick={onSignOut} className="font-mono text-xs text-text-muted hover:text-text cursor-pointer">
            Sign out
          </button>
        </div>
      </header>

      <nav className="flex gap-1 px-4 py-2 border-b border-border overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-3 py-1.5 rounded text-sm font-medium whitespace-nowrap cursor-pointer"
            style={
              tab === t.id
                ? { background: "var(--accent)", color: "var(--accent-contrast)" }
                : { color: "var(--text-muted)" }
            }
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="flex-1 overflow-y-auto p-5 max-w-2xl w-full mx-auto">
        {tab === "report" && (
          <div className="flex flex-col gap-4">
            <button
              onClick={() => submitReport("critical", "SOS — immediate emergency assistance needed")}
              disabled={submitting || !location}
              className="w-full py-5 rounded-lg text-lg font-bold uppercase tracking-wide disabled:opacity-50 cursor-pointer"
              style={{ background: "var(--critical)", color: "#fff" }}
            >
              🆘 SOS — Send Emergency Alert Now
            </button>
            <p className="text-xs text-text-muted text-center -mt-2">
              Instantly files a critical report at your current location.
            </p>

            <div className="bg-panel border border-border rounded-lg p-4 flex flex-col gap-3">
              <span className="text-sm font-semibold">Report an Incident</span>
              <div className="text-xs text-text-muted font-mono">
                {location ? `📍 ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : "Locating…"}
              </div>
              <div className="flex gap-2">
                {SEVERITIES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSeverity(s)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold uppercase cursor-pointer border"
                    style={
                      severity === s
                        ? { background: "var(--accent)", color: "var(--accent-contrast)", borderColor: "var(--accent)" }
                        : { borderColor: "var(--border)", color: "var(--text-muted)" }
                    }
                  >
                    {s}
                  </button>
                ))}
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's happening? Who's affected?"
                rows={4}
                className="bg-panel-alt border border-border rounded px-3 py-2 text-sm outline-none resize-none"
              />
              <button
                onClick={() => submitReport()}
                disabled={submitting || !location}
                className="py-2.5 rounded text-sm font-bold uppercase disabled:opacity-50 cursor-pointer"
                style={{ background: "var(--accent)", color: "var(--accent-contrast)" }}
              >
                {submitting ? "Submitting…" : "Submit Report"}
              </button>
            </div>
          </div>
        )}

        {tab === "alerts" && (
          <div className="flex flex-col gap-2">
            {nearbyAlerts.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-10">No active alerts nearby.</p>
            ) : (
              nearbyAlerts.map((a) => (
                <div key={a.id} className="bg-panel border border-border rounded-lg p-3.5 flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: SEVERITY_COLOR[a.severity_color] }} />
                    <span className="text-sm font-semibold">{a.disaster_type}</span>
                  </div>
                  {a.area_description && <span className="text-xs text-text-muted">{a.area_description}</span>}
                  {a.warning_message && <p className="text-sm">{a.warning_message}</p>}
                </div>
              ))
            )}
          </div>
        )}

        {tab === "shelters" && (
          <div className="h-[70vh] rounded-lg overflow-hidden border border-border">
            <CitizenMap pins={resourcePins} center={location ? [location.lat, location.lng] : undefined} />
          </div>
        )}

        {tab === "mine" && (
          <div className="flex flex-col gap-2">
            {myReports.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-10">You haven&apos;t submitted any reports yet.</p>
            ) : (
              myReports.map((r) => (
                <div key={r.id} className="bg-panel border border-border rounded-lg p-3.5 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold uppercase">{r.severity}</span>
                    <span className="font-mono text-xs uppercase text-text-muted">{r.status}</span>
                  </div>
                  {r.description && <p className="text-sm">{r.description}</p>}
                  <span className="text-xs text-text-muted">{new Date(r.created_at).toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "emergency" && (
          <div className="flex flex-col gap-2">
            {EMERGENCY_CONTACTS.map((c) => (
              <a
                key={c.number}
                href={`tel:${c.number}`}
                className="flex items-center justify-between bg-panel border border-border rounded-lg p-3.5 hover:border-accent"
              >
                <span className="text-sm font-medium">{c.name}</span>
                <span className="font-mono text-base font-bold text-accent">{c.number}</span>
              </a>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
