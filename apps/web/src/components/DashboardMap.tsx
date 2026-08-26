"use client";

import dynamic from "next/dynamic";
import type { Alert, Report, Resource } from "@/lib/useDashboardData";

// Leaflet touches `window` at import time, so it can only run client-side.
const DashboardMapClient = dynamic(() => import("./DashboardMapClient"), {
  ssr: false,
  loading: () => <div style={{ padding: 24 }}>Loading map…</div>,
});

interface Props {
  alerts: Alert[];
  resources: Resource[];
  reports: Report[];
  selectedReportId: string | null;
  onSelectReport: (id: string) => void;
}

export default function DashboardMap(props: Props) {
  return <DashboardMapClient {...props} />;
}
