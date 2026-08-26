"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import BroadcastAlertModal from "@/components/BroadcastAlertModal";
import DashboardMap from "@/components/DashboardMap";
import FallbackPanel from "@/components/FallbackPanel";
import InspectorPanel from "@/components/InspectorPanel";
import ManageResourcesModal from "@/components/ManageResourcesModal";
import ReportsQueue from "@/components/ReportsQueue";
import StatsBar from "@/components/StatsBar";
import ThemeToggle from "@/components/ThemeToggle";
import { useDashboardData } from "@/lib/useDashboardData";
import { useFallbackSimulation } from "@/lib/useFallbackSimulation";

export default function DashboardShell({ onSignOut }: { onSignOut: () => void }) {
  const {
    alerts, resources, reports, loading, allocating, allocate,
    manualAssign, resolveReport, reopenReport, addResource, updateResource, broadcastAlert,
  } = useDashboardData();
  const { events: fallbackEvents, triggerDemoEvent } = useFallbackSimulation(alerts, reports);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [autoAllocate, setAutoAllocate] = useState(false);
  const [showResources, setShowResources] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [showQueue, setShowQueue] = useState(false);

  const selectedReport = reports.find((r) => r.id === selectedReportId) ?? null;

  useEffect(() => {
    if (!autoAllocate || allocating) return;
    const openReport = reports.find((r) => r.status === "open");
    if (openReport) allocate(openReport.id);
  }, [autoAllocate, allocating, reports, allocate]);

  return (
    <div className="flex flex-col h-screen bg-bg text-text">
      <header className="flex items-center justify-between px-7 py-4 border-b border-white/10 bg-white/[0.03] backdrop-blur-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-8 h-8 border border-accent rounded-md flex items-center justify-center">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12h4l2-7 4 14 2-7h6" />
            </svg>
          </div>
          <span className="text-[19px] font-bold tracking-tight">AapdaMitra</span>
          <span className="text-border">|</span>
          <span className="font-mono text-[13px] text-text-muted uppercase tracking-wider">
            National Alert Network · Authority Console
          </span>
        </div>

        <div className="flex items-center gap-3.5">
          <label className="flex items-center gap-2 text-sm text-text-muted cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoAllocate}
              onChange={(e) => setAutoAllocate(e.target.checked)}
            />
            Auto-allocate
          </label>
          <button
            onClick={() => setShowQueue((v) => !v)}
            className="font-mono text-xs px-2.5 py-1.5 rounded border border-border cursor-pointer"
            style={showQueue ? { background: "var(--accent)", color: "var(--accent-contrast)", borderColor: "var(--accent)" } : undefined}
          >
            Reports ({reports.length})
          </button>
          <button
            onClick={() => setShowResources(true)}
            className="font-mono text-xs px-2.5 py-1.5 rounded border border-border cursor-pointer"
          >
            Manage Resources
          </button>
          <button
            onClick={() => setShowBroadcast(true)}
            className="font-mono text-xs px-2.5 py-1.5 rounded border border-border cursor-pointer"
          >
            Broadcast Advisory
          </button>
          <ThemeToggle />
          <span className="font-mono text-xs font-semibold px-3 py-1.5 rounded bg-panel-alt border border-available text-available tracking-wide">
            ● SACHET LIVE
          </span>
          <button
            onClick={onSignOut}
            className="font-mono text-xs text-text-muted hover:text-text cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </header>

      <StatsBar alerts={alerts} resources={resources} reports={reports} />

      <div className="mt-4">
        <FallbackPanel events={fallbackEvents} onTriggerDemo={triggerDemoEvent} />
      </div>

      <main className="relative flex-1 px-7 pb-4 min-h-0">
        <div className="relative h-full min-h-[320px] bg-panel/70 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden flex flex-col shadow-[0_20px_50px_-25px_rgba(0,0,0,0.5)]">
          <div className="tick h-3.5 border-b border-border shrink-0" />
          <div className="flex flex-1 min-h-0">
            <div className="tick-v w-3.5 border-r border-border shrink-0" />
            <div className="flex-1 relative bg-panel-alt">
              {loading ? (
                <div className="flex items-center justify-center h-full text-sm text-text-muted">
                  Loading…
                </div>
              ) : (
                <DashboardMap
                  alerts={alerts}
                  resources={resources}
                  reports={reports}
                  selectedReportId={selectedReportId}
                  onSelectReport={setSelectedReportId}
                />
              )}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showQueue && (
            <>
              <motion.div
                key="queue-backdrop"
                className="absolute inset-0 bg-black/30 z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowQueue(false)}
              />
              <motion.div
                key="queue-panel"
                className="absolute top-0 left-0 h-full w-[300px] z-20"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", stiffness: 320, damping: 32 }}
              >
                <ReportsQueue
                  reports={reports}
                  selectedReportId={selectedReportId}
                  onSelectReport={(id) => {
                    setSelectedReportId(id);
                    setShowQueue(false);
                  }}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {selectedReport && (
            <motion.div
              key="inspector-panel"
              className="absolute top-0 right-0 h-full w-[324px] z-20"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
            >
              <InspectorPanel
                report={selectedReport}
                resources={resources}
                allocating={allocating === selectedReportId}
                onAllocate={allocate}
                onManualAssign={manualAssign}
                onResolve={resolveReport}
                onReopen={reopenReport}
                onClose={() => setSelectedReportId(null)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {showResources && (
        <ManageResourcesModal
          resources={resources}
          onClose={() => setShowResources(false)}
          onAdd={addResource}
          onUpdate={updateResource}
        />
      )}
      {showBroadcast && (
        <BroadcastAlertModal onClose={() => setShowBroadcast(false)} onBroadcast={broadcastAlert} />
      )}
    </div>
  );
}
