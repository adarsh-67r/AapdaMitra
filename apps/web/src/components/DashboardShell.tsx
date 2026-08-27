"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import BroadcastAlertModal from "@/components/BroadcastAlertModal";
import DashboardMap from "@/components/DashboardMap";
import FallbackPanel from "@/components/FallbackPanel";
import InspectorPanel from "@/components/InspectorPanel";
import ManageResourcesModal from "@/components/ManageResourcesModal";
import ReportsQueue from "@/components/ReportsQueue";
import StatsBar from "@/components/StatsBar";
import ThemeToggle from "@/components/ThemeToggle";
import { useToast } from "@/components/Toast";
import { useDashboardData } from "@/lib/useDashboardData";
import { useFallbackSimulation } from "@/lib/useFallbackSimulation";

export default function DashboardShell({ onSignOut }: { onSignOut: () => void }) {
  const {
    alerts, resources, reports, loading, allocating, allocate,
    manualAssign, resolveReport, reopenReport, addResource, updateResource, broadcastAlert,
  } = useDashboardData();
  const { events: fallbackEvents, triggerDemoEvent } = useFallbackSimulation(alerts, reports);
  const toast = useToast();
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [autoAllocate, setAutoAllocate] = useState(false);
  const [showResources, setShowResources] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [showQueue, setShowQueue] = useState(false);

  const selectedReport = reports.find((r) => r.id === selectedReportId) ?? null;

  // Reports the allocator has already declined. Without this the auto-allocate
  // loop retries the same unreachable report on every poll, forever, silently.
  const declined = useRef<Set<string>>(new Set());

  /**
   * Allocation can succeed, or succeed at saying no. Both must be visible.
   *
   * Distance is never a refusal — the allocator returns the nearest available
   * resource however far it is — but a long dispatch is worth saying out loud,
   * so the operator can reconsider rather than discover it later.
   */
  const allocateAndReport = useCallback(
    async (reportId: string) => {
      const result = await allocate(reportId);
      if (result?.assigned) {
        const where =
          result.distance_km != null ? ` · ${Math.round(result.distance_km)} km away` : "";
        toast(
          result.far ? "error" : "success",
          `Dispatched ${result.resource_name ?? "nearest resource"}${where}.` +
            (result.far ? " That is a long way — check it is the right call." : "")
        );
        declined.current.delete(reportId);
      } else {
        declined.current.add(reportId);
        toast("error", result?.reason ?? "No resource could be allocated.");
      }
      return result;
    },
    [allocate, toast]
  );

  useEffect(() => {
    if (!autoAllocate) {
      declined.current.clear();
      return;
    }
    if (allocating) return;
    const openReport = reports.find(
      (r) => r.status === "open" && !declined.current.has(r.id)
    );
    if (openReport) allocateAndReport(openReport.id);
  }, [autoAllocate, allocating, reports, allocateAndReport]);

  return (
    <div className="flex flex-col h-[100dvh] bg-bg text-text">
      <header className="flex items-center justify-between gap-3 flex-wrap px-3 md:px-7 py-2.5 md:py-4 border-b border-border bg-panel">
        <div className="flex items-center gap-3.5">
          <div className="w-8 h-8 border border-accent rounded-md flex items-center justify-center">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12h4l2-7 4 14 2-7h6" />
            </svg>
          </div>
          <span className="text-[19px] font-bold tracking-tight">AapdaMitra</span>
          <span className="hidden lg:inline text-border">|</span>
          <span className="hidden lg:inline font-mono text-[13px] text-text-muted uppercase tracking-wider">
            National Alert Network · Authority Console
          </span>
        </div>

        <div className="flex items-center gap-2 md:gap-4 flex-wrap justify-end">
          <span className="hidden sm:inline font-mono text-xs font-semibold px-2.5 py-1 bg-available/10 border border-available/40 text-available tracking-wide">
            ● SACHET LIVE
          </span>

          <div className="flex items-center gap-px p-px bg-border border border-border">
            <button
              onClick={() => setShowQueue((v) => !v)}
              className="lg:hidden font-mono text-xs px-3 py-1.5 cursor-pointer transition-[colors,transform] duration-[120ms] ease-out active:scale-[0.98]"
              style={
                showQueue
                  ? { background: "var(--accent)", color: "var(--accent-contrast)" }
                  : { color: "var(--text-muted)" }
              }
            >
              Reports ({reports.length})
            </button>
            <button
              onClick={() => setShowResources(true)}
              className="font-mono text-xs px-3 py-1.5 bg-panel text-text-muted hover:text-text cursor-pointer transition-[colors,transform] duration-[120ms] ease-out active:scale-[0.98]"
            >
              Resources
            </button>
            <button
              onClick={() => setShowBroadcast(true)}
              className="font-mono text-xs px-3 py-1.5 bg-panel text-text-muted hover:text-text cursor-pointer transition-[colors,transform] duration-[120ms] ease-out active:scale-[0.98]"
            >
              Broadcast
            </button>
          </div>

          <label className="flex items-center gap-2 font-mono text-xs text-text-muted cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoAllocate}
              onChange={(e) => setAutoAllocate(e.target.checked)}
            />
            Auto-allocate
          </label>

          <div className="flex items-center gap-3 md:gap-3.5 md:pl-4 md:border-l border-border">
            <ThemeToggle />
            <button
              onClick={onSignOut}
              className="font-mono text-xs text-text-muted hover:text-text cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <StatsBar alerts={alerts} resources={resources} reports={reports} />
      <FallbackPanel events={fallbackEvents} onTriggerDemo={triggerDemoEvent} />

      <main className="relative flex-1 px-3 md:px-7 pb-3 md:pb-4 min-h-0 flex gap-3">
        {/* Persistent worklist. Selecting here drives the map, so the operator
            never loses sight of either one. */}
        <aside className="hidden lg:block w-[320px] shrink-0 min-h-0">
          <ReportsQueue
            reports={reports}
            selectedReportId={selectedReportId}
            onSelectReport={setSelectedReportId}
          />
        </aside>

        <div className="relative flex-1 min-w-0 min-h-0">
          <div className="relative h-full min-h-[320px] bg-panel border border-border rounded-sm overflow-hidden flex flex-col">
            <div className="tick h-3.5 border-b border-border shrink-0" />
            <div className="flex flex-1 min-h-0">
              <div className="tick-v w-3.5 border-r border-border shrink-0" />
              <div className="flex-1 relative isolate z-0 bg-panel-alt">
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
                className="lg:hidden absolute inset-0 bg-scrim z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowQueue(false)}
              />
              <motion.div
                key="queue-panel"
                className="lg:hidden absolute top-0 left-0 h-full w-[85%] max-w-[300px] z-20"
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
              className="absolute top-0 right-0 h-full w-full max-w-[324px] z-20"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
            >
              <InspectorPanel
                report={selectedReport}
                resources={resources}
                allocating={allocating === selectedReportId}
                onAllocate={allocateAndReport}
                onManualAssign={manualAssign}
                onResolve={resolveReport}
                onReopen={reopenReport}
                onClose={() => setSelectedReportId(null)}
              />
            </motion.div>
          )}
        </AnimatePresence>
        </div>
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
