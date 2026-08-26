"use client";

import { motion } from "framer-motion";

const FEATURES = [
  { title: "Citizen reporting", body: "Photo and exact GPS location, filed in under a minute.", status: "Live" as const },
  { title: "Live heatmap dashboard", body: "Authorities see report density and hotspots update in real time.", status: "Live" as const },
  { title: "Nearest-resource dispatch", body: "One click matches and dispatches the closest available team.", status: "Live" as const },
  { title: "SMS / IVR fallback", body: "Reporting and alerts for citizens with no internet access.", status: "Planned" as const },
];

export default function FeatureHighlights() {
  return (
    <div id="features" className="relative z-10 px-6 md:px-10 py-14 scroll-mt-20">
      <motion.h3
        initial={{ opacity: 0, y: 14, filter: "blur(8px)" }}
        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 0.6 }}
        className="text-2xl font-bold mb-6"
      >
        What the system does
      </motion.h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.6, delay: i * 0.08 }}
            className="rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 p-5 flex flex-col justify-between min-h-[160px]"
          >
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
          </motion.div>
        ))}
      </div>
    </div>
  );
}
