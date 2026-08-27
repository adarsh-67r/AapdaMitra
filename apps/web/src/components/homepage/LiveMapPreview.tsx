"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/**
 * The hero's map doesn't decorate — it performs the product's core loop on
 * repeat: a report lands, the nearest available resource is matched, a dispatch
 * line draws between them, and the pair resolves. One cycle runs in a few
 * seconds, so a visitor sees what the allocator does without waiting for it.
 */

// Static context markers — the standing picture the loop plays out on top of.
const AMBIENT = [
  { x: 20, y: 30, color: "var(--high)" },
  { x: 82, y: 35, color: "var(--medium)" },
  { x: 15, y: 70, color: "var(--available)" },
  { x: 62, y: 78, color: "var(--available)" },
];

// Each scene: where the report lands and which resource wins the match.
const SCENES = [
  { report: { x: 55, y: 22 }, resource: { x: 72, y: 52 }, place: "Sector 7" },
  { report: { x: 33, y: 62 }, resource: { x: 16, y: 71 }, place: "Riverside" },
  { report: { x: 74, y: 30 }, resource: { x: 83, y: 36 }, place: "MG Road" },
];

const LEGEND = [
  { label: "Alert", color: "var(--high)" },
  { label: "Report", color: "var(--medium)" },
  { label: "Available", color: "var(--available)" },
  { label: "Dispatched", color: "var(--assigned)" },
];

const PHASES = ["reported", "matched", "dispatched"] as const;
type Phase = (typeof PHASES)[number];

const PHASE_LABEL: Record<Phase, string> = {
  reported: "REPORT RECEIVED",
  matched: "NEAREST RESOURCE FOUND",
  dispatched: "DISPATCHED",
};

export default function LiveMapPreview() {
  const reduceMotion = useReducedMotion();
  const [scene, setScene] = useState(0);
  const [phase, setPhase] = useState<Phase>("reported");

  // Advance the story on a fixed beat, then hand off to the next scene.
  useEffect(() => {
    if (reduceMotion) return;
    const timers = [
      setTimeout(() => setPhase("matched"), 900),
      setTimeout(() => setPhase("dispatched"), 1800),
      setTimeout(() => {
        setScene((s) => (s + 1) % SCENES.length);
        setPhase("reported");
      }, 3400),
    ];
    return () => timers.forEach(clearTimeout);
  }, [scene, reduceMotion]);

  const current = SCENES[scene];
  const showResource = phase === "matched" || phase === "dispatched";
  const showLine = phase === "dispatched";

  return (
    <div className="rounded-[28px] bg-panel border border-border p-2 md:p-2.5">
      <div className="relative rounded-[20px] bg-panel border border-border p-5 md:p-6 ">
        <div className="flex justify-between font-mono text-xs tracking-wider text-text-muted mb-3.5">
          <span>
            <span className="text-accent animate-pulse">●</span> LIVE MAP
          </span>
          <AnimatePresence mode="wait">
            <motion.span
              key={phase}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.25 }}
              className="text-accent"
            >
              {PHASE_LABEL[phase]}
            </motion.span>
          </AnimatePresence>
        </div>

        <div
          className="relative h-52 md:h-72 rounded-xl bg-panel-alt overflow-hidden"
          style={{
            backgroundImage:
"linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        >
          {!reduceMotion && (
            <motion.div
              className="absolute inset-0 origin-center opacity-60"
              style={{
                background:
"conic-gradient(from 0deg, transparent 0deg, var(--accent) 18deg, transparent 40deg)",
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />
          )}

          {AMBIENT.map((m, i) => (
            <span
              key={i}
              className="absolute block w-2 h-2 rounded-full opacity-70"
              style={{ left: `${m.x}%`, top: `${m.y}%`, background: m.color, boxShadow: `0 0 10px ${m.color}` }}
            />
          ))}

          {/* Dispatch line, drawn rather than faded — the draw is the point. */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            <AnimatePresence>
              {showLine && (
                <motion.line
                  key={`line-${scene}`}
                  x1={current.report.x}
                  y1={current.report.y}
                  x2={current.resource.x}
                  y2={current.resource.y}
                  stroke="var(--assigned)"
                  strokeWidth={0.6}
                  strokeDasharray="3 2"
                  vectorEffect="non-scaling-stroke"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                />
              )}
            </AnimatePresence>
          </svg>

          {/* The incoming report. */}
          <AnimatePresence>
            <motion.div
              key={`report-${scene}`}
              className="absolute"
              style={{ left: `${current.report.x}%`, top: `${current.report.y}%` }}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.35, duration: 0.6 }}
            >
              {!reduceMotion && (
                <motion.span
                  className="absolute -inset-2.5 rounded-full border"
                  style={{ borderColor: "var(--medium)" }}
                  animate={{ scale: [0.6, 2.4], opacity: [0.7, 0] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
                />
              )}
              <span
                className="block w-3 h-3 rounded-full"
                style={{ background: "var(--medium)", boxShadow: "0 0 14px var(--medium)" }}
              />
            </motion.div>
          </AnimatePresence>

          {/* The matched resource — turns dispatched-blue once the line draws. */}
          <AnimatePresence>
            {showResource && (
              <motion.div
                key={`resource-${scene}`}
                className="absolute"
                style={{ left: `${current.resource.x}%`, top: `${current.resource.y}%` }}
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
              >
                <motion.span
                  className="block w-3 h-3 rounded-full"
                  animate={{
                    backgroundColor: showLine ? "var(--assigned)" : "var(--available)",
                    boxShadow: showLine ? "0 0 16px var(--assigned)" : "0 0 12px var(--available)",
                  }}
                  transition={{ duration: 0.4 }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 mt-3.5">
          <div className="flex flex-wrap gap-4 font-mono text-xs text-text-muted">
            {LEGEND.map((l) => (
              <span key={l.label} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: l.color }} />
                {l.label}
              </span>
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.span
              key={`${scene}-${phase}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="font-mono text-xs text-text-muted"
            >
              {current.place}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
