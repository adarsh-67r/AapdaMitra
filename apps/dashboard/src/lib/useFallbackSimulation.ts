"use client";

import { useEffect, useRef, useState } from "react";
import type { Alert, Report } from "./useDashboardData";

export interface FallbackEvent {
  id: string;
  channel: "SMS" | "IVR";
  message: string;
  at: number;
}

const MAX_EVENTS = 20;

// Simulates the no-internet-zone fallback channel — no real Twilio/telephony
// integration (deliberate scope decision). Only fires for items that arrive
// *during* the session, not the initial batch already loaded, so opening the
// dashboard doesn't replay every existing alert as a fake SMS blast.
export function useFallbackSimulation(alerts: Alert[], reports: Report[]) {
  const [events, setEvents] = useState<FallbackEvent[]>([]);
  const seenAlertIds = useRef<Set<string> | null>(null);
  const seenReportIds = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (seenAlertIds.current === null) {
      seenAlertIds.current = new Set(alerts.map((a) => a.id));
      return;
    }
    const newSevere = alerts.filter(
      (a) =>
        !seenAlertIds.current!.has(a.id) &&
        (a.severity_color === "orange" || a.severity_color === "red")
    );
    newSevere.forEach((a) => seenAlertIds.current!.add(a.id));
    alerts.forEach((a) => seenAlertIds.current!.add(a.id));

    if (newSevere.length > 0) {
      setEvents((prev) => [
        ...newSevere.map((a) => ({
          id: `sms-${a.id}`,
          channel: "SMS" as const,
          message: `SMS sent to residents near ${a.area_description ?? a.disaster_type} — ${a.disaster_type}`,
          at: Date.now(),
        })),
        ...prev,
      ].slice(0, MAX_EVENTS));
    }
  }, [alerts]);

  useEffect(() => {
    if (seenReportIds.current === null) {
      seenReportIds.current = new Set(reports.map((r) => r.id));
      return;
    }
    const newCritical = reports.filter(
      (r) => !seenReportIds.current!.has(r.id) && (r.severity === "critical" || r.severity === "high")
    );
    reports.forEach((r) => seenReportIds.current!.add(r.id));

    if (newCritical.length > 0) {
      setEvents((prev) => [
        ...newCritical.map((r) => ({
          id: `ivr-${r.id}`,
          channel: "IVR" as const,
          message: `IVR call logged for ${r.severity} report near ${r.lat.toFixed(2)}, ${r.lng.toFixed(2)}`,
          at: Date.now(),
        })),
        ...prev,
      ].slice(0, MAX_EVENTS));
    }
  }, [reports]);

  // Manual trigger for demo reliability — waiting on real SACHET data or a
  // real citizen report to arrive at the right moment during a live demo
  // isn't dependable, so the presenter can fire a sample event on demand.
  const triggerDemoEvent = () => {
    const samples: Omit<FallbackEvent, "id" | "at">[] = [
      { channel: "SMS", message: "SMS sent to 1,240 residents near Marina Beach — Flood Warning" },
      { channel: "IVR", message: "IVR call logged for critical report near 13.05, 80.24" },
    ];
    const sample = samples[Math.floor(Math.random() * samples.length)];
    setEvents((prev) =>
      [{ ...sample, id: `demo-${Date.now()}`, at: Date.now() }, ...prev].slice(0, MAX_EVENTS)
    );
  };

  return { events, triggerDemoEvent };
}
