"use client";

import { motion } from "framer-motion";
import CountUp from "./CountUp";
import { enter, enterStaggered } from "@/lib/motion";

const STATS = [
  { value: "1", label: "Live alert feed (SACHET)" },
  { value: "12s", label: "Map refresh interval" },
  { value: "1", label: "Click to dispatch" },
];

/**
 * The whole panel used to arrive as one block, so three separate facts landed as
 * a single event and read as one. They arrive in sequence now — the panel first,
 * then each figure — which is what makes them read as three things worth
 * counting rather than a decorative row.
 */
export default function CapabilityStats() {
  return (
    <div id="capabilities" className="relative z-10 px-6 md:px-10 py-14">
      <motion.div
        {...enter}
        className="panel p-7 md:p-9 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border text-center"
      >
        {STATS.map((s, i) => (
          <motion.div
            key={s.label}
            // Offset past the panel's own entrance so the figures land inside a
            // container that has already arrived, not alongside it.
            {...enterStaggered(i + 1)}
            className="px-4 py-5 sm:py-0"
          >
            <b className="block text-4xl md:text-5xl font-bold text-accent leading-none tabular-nums">
              <CountUp value={s.value} />
            </b>
            <span className="font-mono text-xs text-text-muted mt-2 block">{s.label}</span>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
