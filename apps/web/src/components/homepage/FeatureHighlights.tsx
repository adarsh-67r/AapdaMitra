"use client";

import { motion } from "framer-motion";
import { enter, enterStaggered } from "@/lib/motion";
import TiltCard from "./TiltCard";

const FEATURES = [
  { title: "Citizen reporting", body: "Photo and exact GPS location, filed in under a minute.", status: "Live" as const },
  { title: "Live heatmap dashboard", body: "Authorities see report density and hotspots update in real time.", status: "Live" as const },
  { title: "Nearest-resource dispatch", body: "One click matches and dispatches the closest available team.", status: "Live" as const },
  { title: "SMS / IVR fallback", body: "Reporting and alerts for citizens with no internet access.", status: "Planned" as const },
];

export default function FeatureHighlights() {
  return (
    <div id="features" className="relative z-10 px-6 md:px-10 py-14 scroll-mt-20">
      <motion.h3 {...enter} className="text-3xl md:text-4xl font-bold tracking-[-0.02em] text-balance mb-8">
        What the system does
      </motion.h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {FEATURES.map((f, i) => (
          <motion.div key={f.title} {...enterStaggered(i)}>
            <TiltCard className="h-full rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 p-5 flex flex-col justify-between min-h-[160px] hover:border-accent/40 transition-colors">
              <div>
                <h5 className="font-semibold mb-1.5">{f.title}</h5>
                <p className="text-sm text-text-muted leading-relaxed">{f.body}</p>
              </div>
              <span
                className={
                  "font-mono text-[0.7rem] tracking-wide mt-4 self-start px-2.5 py-1 rounded-full " +
                  (f.status === "Live" ? "bg-available/15 text-available" : "bg-medium/15 text-medium")
                }
              >
                {f.status.toUpperCase()}
              </span>
            </TiltCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
