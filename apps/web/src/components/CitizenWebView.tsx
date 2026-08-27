"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import CitizenMap from "@/components/CitizenMap";
import CitizenDashboard from "@/components/citizen/CitizenDashboard";
import LocationStatus from "@/components/citizen/LocationStatus";
import { useGeolocation } from "@/lib/use-geolocation";
import { useMarkerPalette } from "@/lib/severity-colors";
import ThemeToggle from "@/components/ThemeToggle";
import { apiFetch, apiFetchJson } from "@/lib/api-client";
import { useToast } from "@/components/Toast";
import { haversineKm } from "@/lib/geo-client";
import type { MapPin } from "@/components/CitizenMapClient";
import {
  AlertTriangleIcon,
  CameraIcon,
  MapPinIcon,
  PhoneIcon,
  ReportsIcon,
  ShelterIcon,
  DashboardIcon,
  SosIcon,
} from "@/components/icons";

type Tab = "dashboard" | "report" | "alerts" | "shelters" | "mine" | "emergency";

type IconComponent = (props: { size?: number; className?: string }) => React.ReactElement;

const MENU: { id: Tab; label: string; short: string; Icon: IconComponent; description: string }[] = [
  { id: "dashboard", label: "Dashboard", short: "Home", Icon: DashboardIcon, description: "Alerts, shelters and teams nearest to where you are" },
  { id: "report", label: "Report Incident", short: "Report", Icon: MapPinIcon, description: "Photo, location, severity — filed in under a minute" },
  { id: "alerts", label: "Live Alerts", short: "Alerts", Icon: AlertTriangleIcon, description: "Official warnings near you, updated continuously" },
  { id: "shelters", label: "Find Shelter", short: "Shelter", Icon: ShelterIcon, description: "Nearest shelters and resources on the map" },
  { id: "mine", label: "My Reports", short: "Mine", Icon: ReportsIcon, description: "Track the status of what you've reported" },
  { id: "emergency", label: "Emergency Contacts", short: "Help", Icon: PhoneIcon, description: "Fire, police, ambulance, disaster helplines" },
];

const TAB_LABEL: Record<Tab, string> = {
  dashboard: "Dashboard",
  report: "Report Incident",
  alerts: "Live Alerts",
  shelters: "Find Shelter",
  mine: "My Reports",
  emergency: "Emergency Contacts",
};

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
  issuing_agency: string | null;
  language: string | null;
  lat: number;
  lng: number;
}

const LANGUAGE_LABEL: Record<string, string> = {
  en: "English",
  hi: "हिन्दी",
  ml: "മലയാളം",
  te: "తెలుగు",
  or: "ଓଡ଼ିଆ",
  ta: "தமிழ்",
  bn: "বাংলা",
  mr: "मराठी",
  gu: "ગુજરાતી",
  kn: "ಕನ್ನಡ",
};

interface ResourceRow {
  id: string;
  type: "shelter" | "rescue_team" | "supply_stock";
  name: string;
  lat: number;
  lng: number;
  capacity: number | null;
  status: "available" | "full" | "dispatched";
}

interface ReportRow {
  id: string;
  severity: Severity;
  description: string | null;
  status: "open" | "assigned" | "resolved";
  created_at: string;
}

const POLL_INTERVAL_MS = 12000;

export default function CitizenWebView({ onSignOut }: { onSignOut: () => void }) {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("dashboard");
  const geo = useGeolocation();
  const palette = useMarkerPalette();
  const location = geo.coords;
  const [severity, setSeverity] = useState<Severity>("medium");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  function pickPhoto(file: File | null) {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhoto(file);
    setPhotoPreview(file ? URL.createObjectURL(file) : null);
  }

  function clearPhoto() {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhoto(null);
    setPhotoPreview(null);
  }

  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [resources, setResources] = useState<ResourceRow[]>([]);
  const [myReports, setMyReports] = useState<ReportRow[]>([]);

  const loadAll = useCallback(async () => {
    try {
      const [a, r, rep] = await Promise.all([
        apiFetchJson<AlertRow[]>("/alerts"),
        apiFetchJson<ResourceRow[]>("/resources"),
        apiFetchJson<ReportRow[]>("/reports"),
      ]);
      setAlerts(a);
      setResources(r);
      setMyReports(rep);
    } catch (e) {
      console.error("citizen web view poll failed", e);
    }
  }, []);

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadAll]);

  const nearbyAlerts = useMemo(() => {
    if (!location) return alerts;
    return alerts.filter((a) => haversineKm(location, a) <= 150);
  }, [alerts, location]);

  const resourcePins: MapPin[] = useMemo(
    () =>
      resources.map((r) => ({
        lat: r.lat,
        lng: r.lng,
        color: palette.resource[r.status],
        title: r.name,
        description: `${r.type.replace("_", " ")} — ${r.status}${
          r.capacity ? ` · capacity ${r.capacity}` : ""
        }`,
      })),
    [resources, palette]
  );

  async function submitReport(overrideSeverity?: Severity, overrideDescription?: string) {
    if (!location) {
      toast("error", "Location not available yet — allow location access and try again.");
      return;
    }
    setSubmitting(true);
    try {
      const report = await apiFetchJson<{ id: string }>("/reports", {
        method: "POST",
        body: JSON.stringify({
          lat: location.lat,
          lng: location.lng,
          severity: overrideSeverity ?? severity,
          description: overrideDescription ?? description,
          place_label: geo.placeLabel,
          location_source: geo.source,
        }),
      });

      // Photo is attached in a second call: the backend proxies the upload to
      // storage and needs an existing report id to attach it to. Only the
      // detailed form path carries a photo — the SOS button never does.
      if (photo && !overrideSeverity) {
        const form = new FormData();
        form.append("file", photo);
        const res = await apiFetch(`/reports/${report.id}/photo`, { method: "POST", body: form });
        if (!res.ok) throw new Error(`report saved, but photo upload failed (${res.status})`);
      }

      setDescription("");
      setSeverity("medium");
      clearPhoto();
      toast("success", "Report submitted. Authorities have been notified.");
      loadAll();
    } catch (e) {
      toast("error", `Submission failed: ${e instanceof Error ? e.message : "unknown error"}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-bg text-text">
      <header className="flex items-center justify-between px-5 md:px-6 py-3 border-b border-border bg-panel shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 border border-accent flex items-center justify-center" style={{ borderRadius: 2 }}>
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

      <div className="flex flex-1 min-h-0">
        {/* Vertical rail. On a phone it becomes a horizontal strip above the
            content, because a fixed side rail would eat the width the report
            form needs. */}
        {/* On a phone this is a bottom tab bar — reporting happens one-handed
            under stress, so the sections belong within thumb reach rather than
            in a strip that has to be scrolled sideways to reach "Report". */}
        <nav
          aria-label="Sections"
          className="fixed bottom-0 inset-x-0 z-30 grid grid-cols-6 gap-px bg-border border-t border-border
                     md:static md:z-auto md:flex md:flex-col md:w-56 md:shrink-0 md:gap-px
                     md:border-t-0 md:border-r md:overflow-y-auto"
        >
          {MENU.map((m) => {
            const active = tab === m.id;
            const badge =
              m.id === "alerts" ? nearbyAlerts.length : m.id === "mine" ? myReports.length : 0;
            return (
              <button
                key={m.id}
                onClick={() => setTab(m.id)}
                aria-current={active ? "page" : undefined}
                className={
                  "relative flex flex-col items-center justify-center gap-1 px-1 py-2 min-h-[56px] cursor-pointer transition-colors duration-150 " +
                  "md:flex-row md:justify-start md:gap-2.5 md:px-4 md:py-3 md:min-h-0 md:text-left " +
                  (active ? "bg-bg text-text" : "bg-panel text-text-muted hover:text-text hover:bg-panel-alt")
                }
              >
                {/* The active marker is a rule, not a pill — it reads as a
                    selected row on an instrument. */}
                <span
                  aria-hidden
                  className={
                    "absolute bg-accent transition-opacity duration-150 " +
                    "inset-x-0 top-0 h-0.5 md:inset-y-0 md:left-0 md:right-auto md:top-auto md:h-auto md:w-0.5 " +
                    (active ? "opacity-100" : "opacity-0")
                  }
                />
                <m.Icon size={18} className={active ? "text-accent" : undefined} />
                <span className="text-[0.62rem] leading-none md:text-sm md:font-medium md:leading-normal">
                  <span className="md:hidden">{m.short}</span>
                  <span className="hidden md:inline">{m.label}</span>
                </span>
                {badge > 0 && (
                  <span
                    className="absolute top-1 right-1/2 translate-x-3.5 md:static md:translate-x-0 md:ml-auto
                               font-mono text-[0.6rem] md:text-[0.65rem] tabular-nums px-1 md:px-1.5 py-0.5
                               bg-accent text-accent-contrast md:bg-panel-alt md:text-text md:border md:border-border"
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <main className="flex-1 min-w-0 overflow-y-auto px-4 md:px-8 py-5 md:py-6 pb-24 md:pb-6">
          <div className="max-w-3xl w-full">
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 sm:gap-4 mb-5 pb-3 border-b border-border">
              <h2 className="text-lg font-semibold">{TAB_LABEL[tab]}</h2>
              <LocationStatus
                coords={geo.coords}
                status={geo.status}
                source={geo.source}
                accuracyM={geo.accuracyM}
                placeLabel={geo.placeLabel}
                onRetry={geo.retry}
                onManual={geo.setManual}
              />
            </div>

            {tab === "dashboard" && (
              <CitizenDashboard
                coords={geo.coords}
                source={geo.source}
                placeLabel={geo.placeLabel}
                alerts={alerts}
                resources={resources}
                myReports={myReports}
              />
            )}


        {tab === "report" && (
          <div className="flex flex-col gap-4">
            <button
              onClick={() => submitReport("critical", "SOS — immediate emergency assistance needed")}
              disabled={submitting || !location}
              title={location ? undefined : "Set your location first — use the readout above."}
              className="w-full py-5 rounded-sm text-lg font-bold uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2.5 transition-transform duration-150 ease-out active:scale-[0.97]"
              style={{ background: "var(--critical)", color: "#fff" }}
            >
              <SosIcon size={22} />
              SOS — Send Emergency Alert Now
            </button>
            <p className="text-xs text-text-muted text-center -mt-2">
              Instantly files a critical report at your current location.
            </p>

            <div className="bg-panel border border-border rounded-sm p-4 flex flex-col gap-3">
              <span className="text-sm font-semibold">Report an Incident</span>
              <div className="flex gap-2">
                {SEVERITIES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSeverity(s)}
                    className="px-3 py-1.5 text-xs font-semibold uppercase cursor-pointer border transition-transform duration-[120ms] ease-out active:scale-[0.96]"
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

              {photoPreview ? (
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoPreview}
                    alt="Attached photo preview"
                    className="w-20 h-20 object-cover rounded-lg border border-border"
                  />
                  <button
                    onClick={clearPhoto}
                    className="font-mono text-xs text-text-muted hover:text-critical cursor-pointer"
                  >
                    Remove photo
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 py-2.5 rounded border border-dashed border-border text-sm text-text-muted cursor-pointer hover:border-accent hover:text-text transition-colors">
                  <CameraIcon size={17} />
                  Attach a photo
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => pickPhoto(e.target.files?.[0] ?? null)}
                  />
                </label>
              )}

              <button
                onClick={() => submitReport()}
                disabled={submitting || !location}
                title={location ? undefined : "Set your location first — use the readout above."}
                className="control-primary py-2.5 text-sm font-bold uppercase disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {submitting ? "Submitting…" : "Submit Report"}
              </button>
              {!location && (
                <p className="text-xs text-text-muted text-center" role="status">
                  Set your location above to file a report.
                </p>
              )}
            </div>
          </div>
        )}

        {tab === "alerts" && (
          <div className="flex flex-col gap-2">
            {nearbyAlerts.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-10">No active alerts nearby.</p>
            ) : (
              nearbyAlerts.map((a) => (
                <div key={a.id} className="bg-panel border border-border rounded-sm p-3.5 flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: palette.alert[a.severity_color] }} />
                      <span className="text-sm font-semibold">{a.disaster_type}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {a.language && a.language !== "en" && (
                        <span className="text-[0.65rem] px-2 py-0.5 bg-accent/15 border border-accent/30 text-accent whitespace-nowrap">
                          {LANGUAGE_LABEL[a.language] ?? a.language.toUpperCase()}
                        </span>
                      )}
                      {a.issuing_agency && (
                        <span className="font-mono text-[0.65rem] px-2 py-0.5 bg-panel-alt border border-border text-text-muted whitespace-nowrap">
                          {a.issuing_agency}
                        </span>
                      )}
                    </div>
                  </div>
                  {a.area_description && <span className="text-xs text-text-muted">{a.area_description}</span>}
                  {a.warning_message && <p className="text-sm">{a.warning_message}</p>}
                </div>
              ))
            )}
          </div>
        )}

        {tab === "shelters" && (
          <div className="h-[70vh] rounded-sm overflow-hidden border border-border">
            <CitizenMap pins={resourcePins} center={location ? [location.lat, location.lng] : undefined} />
          </div>
        )}

        {tab === "mine" && (
          <div className="flex flex-col gap-2">
            {myReports.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-10">You haven&apos;t submitted any reports yet.</p>
            ) : (
              myReports.map((r) => (
                <div key={r.id} className="bg-panel border border-border rounded-sm p-3.5 flex flex-col gap-1">
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
                className="flex items-center justify-between bg-panel border border-border rounded-sm p-3.5 hover:border-accent"
              >
                <span className="text-sm font-medium">{c.name}</span>
                <span className="font-mono text-base font-bold text-accent">{c.number}</span>
              </a>
            ))}
          </div>
        )}
          </div>
        </main>
      </div>
    </div>
  );
}
