"use client";

import { motion } from "framer-motion";
import { enter } from "@/lib/motion";

const STATS = [
  { value: "1", label: "Live alert feed (SACHET)" },
  { value: "12s", label: "Map refresh interval" },
  { value: "1", label: "Click to dispatch" },
];

export default function CapabilityStats() {
  return (
    <div className="relative z-10 px-6 md:px-10 py-14">
      <motion.div {...enter} className="rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 p-7 md:p-9 flex flex-wrap justify-center gap-10 text-center">
        {STATS.map((s) => (
          <div key={s.label}>
            <b className="block text-4xl font-bold text-accent leading-none">{s.value}</b>
            <span className="font-mono text-xs text-text-muted mt-2 block">{s.label}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
