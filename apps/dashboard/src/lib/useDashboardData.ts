"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase-client";

export interface Alert {
  id: string;
  disaster_type: string;
  area_description: string | null;
  severity_color: "green" | "yellow" | "orange" | "red";
  warning_message: string | null;
  lat: number;
  lng: number;
}

export interface Resource {
  id: string;
  type: "shelter" | "rescue_team" | "supply_stock";
  name: string;
  lat: number;
  lng: number;
  capacity: number;
  status: "available" | "full" | "dispatched";
}

export interface Report {
  id: string;
  lat: number;
  lng: number;
  severity: "low" | "medium" | "high" | "critical";
  description: string | null;
  status: "open" | "assigned" | "resolved";
  assigned_resource_id: string | null;
  created_at: string;
}

export function useDashboardData() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [allocating, setAllocating] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    const [a, r, rep] = await Promise.all([
      supabase.from("alerts").select("id, disaster_type, area_description, severity_color, warning_message, lat, lng"),
      supabase.from("resources").select("id, type, name, lat, lng, capacity, status"),
      supabase.from("reports").select("id, lat, lng, severity, description, status, assigned_resource_id, created_at").order("created_at", { ascending: false }),
    ]);
    if (a.data) setAlerts(a.data as Alert[]);
    if (r.data) setResources(r.data as Resource[]);
    if (rep.data) setReports(rep.data as Report[]);
    setLoading(false);
  }, []);

  const allocate = useCallback(async (reportId: string) => {
    setAllocating(reportId);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const res = await fetch("/api/allocate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionData.session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ report_id: reportId }),
      });
      const data = await res.json();
      await loadAll();
      return data as { assigned: boolean; resource_id?: string; reason?: string };
    } finally {
      setAllocating(null);
    }
  }, [loadAll]);

  // Manual override of allocate(): authority picks a specific resource
  // rather than automatic nearest-match. Frees the report's previous
  // resource (if any) back to available before dispatching the new one.
  const manualAssign = useCallback(async (reportId: string, resourceId: string) => {
    const report = reports.find((r) => r.id === reportId);
    if (report?.assigned_resource_id && report.assigned_resource_id !== resourceId) {
      await supabase.from("resources").update({ status: "available" }).eq("id", report.assigned_resource_id);
    }
    await supabase.from("reports").update({ status: "assigned", assigned_resource_id: resourceId }).eq("id", reportId);
    await supabase.from("resources").update({ status: "dispatched" }).eq("id", resourceId);
    await loadAll();
  }, [reports, loadAll]);

  const resolveReport = useCallback(async (reportId: string) => {
    await supabase.from("reports").update({ status: "resolved" }).eq("id", reportId);
    await loadAll();
  }, [loadAll]);

  // Reopens a report and frees whatever resource was assigned to it — the
  // "cancel this assignment" action.
  const reopenReport = useCallback(async (reportId: string) => {
    const report = reports.find((r) => r.id === reportId);
    if (report?.assigned_resource_id) {
      await supabase.from("resources").update({ status: "available" }).eq("id", report.assigned_resource_id);
    }
    await supabase.from("reports").update({ status: "open", assigned_resource_id: null }).eq("id", reportId);
    await loadAll();
  }, [reports, loadAll]);

  const addResource = useCallback(async (resource: Omit<Resource, "id">) => {
    await supabase.from("resources").insert(resource);
    await loadAll();
  }, [loadAll]);

  const updateResource = useCallback(async (id: string, updates: Partial<Omit<Resource, "id">>) => {
    await supabase.from("resources").update(updates).eq("id", id);
    await loadAll();
  }, [loadAll]);

  const broadcastAlert = useCallback(async (alert: {
    disaster_type: string;
    severity_color: Alert["severity_color"];
    area_description: string;
    warning_message: string;
    lat: number;
    lng: number;
  }) => {
    await supabase.from("alerts").insert({ ...alert, source: "authority_advisory" });
    await loadAll();
  }, [loadAll]);

  useEffect(() => {
    loadAll();
    const channel = supabase
      .channel("dashboard-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "resources" }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "alerts" }, loadAll)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadAll]);

  return {
    alerts, resources, reports, loading, allocating, allocate,
    manualAssign, resolveReport, reopenReport, addResource, updateResource, broadcastAlert,
    refresh: loadAll,
  };
}
