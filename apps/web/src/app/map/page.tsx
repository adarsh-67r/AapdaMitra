"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import CitizenMap from "@/components/CitizenMap";
import type { MapPin } from "@/components/CitizenMapClient";
import ThemeToggle from "@/components/ThemeToggle";
import { DEMO_CITIZEN } from "@/lib/demo-accounts";

// This page must NOT touch the shared auth store or localStorage token —
// it's a public, unauthenticated-feeling view, not part of the logged-in
// app. It gets its own local, in-memory token via a direct API call, used
// only for the fetches on this page, and never written to localStorage or
// the shared useAuth() status (so visiting /map never signs the visitor
// into the rest of the app).
const API_BASE = process.env.NEXT_PUBLIC_API_URL!;

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

async function fetchLocalToken(): Promise<string> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(DEMO_CITIZEN),
  });
  if (!res.ok) throw new Error("could not load live data");
  const data = (await res.json()) as { token: string };
  return data.token;
}

export default function MapPage() {
  const [token, setToken] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [resources, setResources] = useState<ResourceRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchLocalToken()
      .then((t) => {
        if (!cancelled) setToken(t);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load live data.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    async function poll() {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [alertsRes, resourcesRes] = await Promise.all([
          fetch(`${API_BASE}/alerts`, { headers }),
          fetch(`${API_BASE}/resources`, { headers }),
        ]);
        if (!alertsRes.ok || !resourcesRes.ok) throw new Error("request failed");
        const [a, r] = await Promise.all([alertsRes.json(), resourcesRes.json()]);
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
  }, [token]);

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
    <div className="flex flex-col h-[100dvh] bg-bg text-text">
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
