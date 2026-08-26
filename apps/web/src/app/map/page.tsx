"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import CitizenMap from "@/components/CitizenMap";
import type { MapPin } from "@/components/CitizenMapClient";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/lib/use-auth";
import { apiFetchJson } from "@/lib/api-client";
import { DEMO_CITIZEN } from "@/lib/demo-accounts";

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

const SEVERITY_COLOR: Record<AlertRow["severity_color"], string> = {
  green: "#2E9E4A",
  yellow: "#D8B400",
  orange: "#E08A00",
  red: "#D64545",
};

const RESOURCE_COLOR: Record<ResourceRow["status"], string> = {
  available: "#2E9E4A",
  full: "#D64545",
  dispatched: "#E08A00",
};

const INDIA_CENTER: [number, number] = [22.9734, 78.6569];
const POLL_INTERVAL_MS = 12000;

export default function MapPage() {
  const { status, login } = useAuth();
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [resources, setResources] = useState<ResourceRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading" || status === "signed-out") {
      login(DEMO_CITIZEN.email, DEMO_CITIZEN.password).catch(() => setError("Could not load live data."));
    }
  }, [status, login]);

  useEffect(() => {
    if (status !== "citizen" && status !== "authority") return;
    let cancelled = false;
    async function poll() {
      try {
        const [a, r] = await Promise.all([
          apiFetchJson<AlertRow[]>("/alerts"),
          apiFetchJson<ResourceRow[]>("/resources"),
        ]);
        if (!cancelled) {
          setAlerts(a);
          setResources(r);
        }
      } catch {
        if (!cancelled) setError("Could not load live data.");
      }
    }
    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [status]);

  const pins: MapPin[] = [
    ...alerts.map((a) => ({
      lat: a.lat,
      lng: a.lng,
      color: SEVERITY_COLOR[a.severity_color],
      title: a.disaster_type,
      description: a.warning_message ?? a.area_description ?? "",
    })),
    ...resources.map((r) => ({
      lat: r.lat,
      lng: r.lng,
      color: RESOURCE_COLOR[r.status],
      title: r.name,
      description: `${r.type.replace("_", " ")} — ${r.status}`,
    })),
  ];

  return (
    <div className="flex flex-col h-screen bg-bg text-text">
      <header className="flex items-center justify-between px-6 py-3.5 border-b border-border">
        <Link href="/" className="text-base font-bold tracking-tight">
          AapdaMitra
        </Link>
        <div className="flex items-center gap-3.5">
          <div className="hidden md:flex gap-3 font-mono text-[0.68rem] text-text-muted flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: SEVERITY_COLOR.red }} /> Severe
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: SEVERITY_COLOR.orange }} /> High
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: SEVERITY_COLOR.yellow }} /> Moderate
            </span>
            <span className="text-border">|</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: RESOURCE_COLOR.available }} /> Available
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: RESOURCE_COLOR.dispatched }} /> Dispatched
            </span>
          </div>
          <ThemeToggle />
        </div>
      </header>
      <div className="relative flex-1">
        <CitizenMap pins={pins} center={INDIA_CENTER} zoom={5} />
        {error && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 font-mono text-xs px-4 py-2 rounded-full bg-panel border border-critical text-critical">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
