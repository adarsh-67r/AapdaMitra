"use client";

import { motion } from "framer-motion";

type Marker = { x: number; y: number; color: string };

const MARKERS: Marker[] = [
  { x: 20, y: 30, color: "var(--high)" },
  { x: 55, y: 20, color: "var(--medium)" },
  { x: 70, y: 55, color: "var(--available)" },
  { x: 35, y: 65, color: "var(--assigned)" },
  { x: 82, y: 35, color: "var(--medium)" },
  { x: 15, y: 70, color: "var(--available)" },
];

const LEGEND = [
  { label: "Alert", color: "var(--high)" },
  { label: "Report", color: "var(--medium)" },
  { label: "Available", color: "var(--available)" },
  { label: "Dispatched", color: "var(--assigned)" },
];

export default function LiveMapPreview() {
  return (
    <div className="rounded-[26px] bg-white/5 border border-white/10 p-2">
      <div className="relative rounded-[20px] bg-panel/55 backdrop-blur-2xl border border-white/5 p-5 md:p-6 shadow-[0_30px_70px_-25px_rgba(0,0,0,0.7)]">
        <div className="flex justify-between font-mono text-xs tracking-wider text-text-muted mb-3.5">
          <span>
            <span className="text-accent animate-pulse">●</span> LIVE MAP
          </span>
          <span>3 alerts &middot; 6 reports</span>
        </div>
        <div className="relative h-52 rounded-xl bg-panel-alt overflow-hidden">
          {MARKERS.map((m, i) => (
            <div key={i} className="absolute" style={{ left: `${m.x}%`, top: `${m.y}%` }}>
              <motion.span
                className="absolute -inset-2 rounded-full border"
                style={{ borderColor: m.color }}
                animate={{ scale: [0.6, 2.2], opacity: [0.6, 0] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut", delay: i * 0.3 }}
              />
              <span className="block w-2.5 h-2.5 rounded-full" style={{ background: m.color }} />
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-4 mt-3.5 font-mono text-xs text-text-muted">
          {LEGEND.map((l) => (
            <span key={l.label} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: l.color }} />
              {l.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
