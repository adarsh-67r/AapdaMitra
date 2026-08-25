"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetchJson } from "./api-client";

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

const POLL_INTERVAL_MS = 12000;

export function useDashboardData() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [allocating, setAllocating] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    const [a, r, rep] = await Promise.all([
      apiFetchJson<Alert[]>("/alerts"),
      apiFetchJson<Resource[]>("/resources"),
      apiFetchJson<Report[]>("/reports"),
    ]);
    setAlerts(a);
    setResources(r);
    setReports(rep);
    setLoading(false);
  }, []);

  const allocate = useCallback(async (reportId: string) => {
    setAllocating(reportId);
    try {
      const data = await apiFetchJson<{ assigned: boolean; resource_id?: string; reason?: string }>(
        "/allocate",
        { method: "POST", body: JSON.stringify({ report_id: reportId }) }
      );
      await loadAll();
      return data;
    } finally {
      setAllocating(null);
    }
  }, [loadAll]);

  const manualAssign = useCallback(async (reportId: string, resourceId: string) => {
    await apiFetchJson(`/reports/${reportId}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "assigned", assigned_resource_id: resourceId }),
    });
    await apiFetchJson(`/resources/${resourceId}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "dispatched" }),
    });
    await loadAll();
  }, [loadAll]);

  const resolveReport = useCallback(async (reportId: string) => {
    await apiFetchJson(`/reports/${reportId}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "resolved" }),
    });
    await loadAll();
  }, [loadAll]);

  const reopenReport = useCallback(async (reportId: string) => {
    await apiFetchJson(`/reports/${reportId}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "open", assigned_resource_id: null }),
    });
    await loadAll();
  }, [loadAll]);

  const addResource = useCallback(async (resource: Omit<Resource, "id">) => {
    await apiFetchJson("/resources", { method: "POST", body: JSON.stringify(resource) });
    await loadAll();
  }, [loadAll]);

  const updateResource = useCallback(async (id: string, updates: Partial<Omit<Resource, "id">>) => {
    await apiFetchJson(`/resources/${id}`, { method: "PATCH", body: JSON.stringify(updates) });
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
    await apiFetchJson("/alerts", { method: "POST", body: JSON.stringify(alert) });
    await loadAll();
  }, [loadAll]);

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadAll]);

  return {
    alerts, resources, reports, loading, allocating, allocate,
    manualAssign, resolveReport, reopenReport, addResource, updateResource, broadcastAlert,
    refresh: loadAll,
  };
}
