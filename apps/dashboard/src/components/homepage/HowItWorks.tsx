"use client";

import { motion } from "framer-motion";

const STEPS = [
  { n: "01", title: "Report", body: "A citizen files a report with a photo and exact location, no login friction." },
  { n: "02", title: "See it live", body: "Authorities see it land on the map instantly, alongside every available resource nearby." },
  { n: "03", title: "Dispatch", body: "One click sends the nearest available team — ambulance, rescue, or shelter — to the exact spot." },
];

export default function HowItWorks() {
  return (
    <div className="relative z-10 px-6 md:px-10 py-14">
      <motion.h3
        initial={{ opacity: 0, y: 14, filter: "blur(8px)" }}
        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 0.6 }}
        className="text-2xl font-bold mb-6"
      >
        How it works
      </motion.h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {STEPS.map((s, i) => (
          <motion.div
            key={s.n}
            initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.6, delay: i * 0.08 }}
            className="rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 p-5"
          >
            <div className="font-mono text-xs text-accent">{s.n}</div>
            <h5 className="font-semibold mt-2.5 mb-1.5">{s.title}</h5>
            <p className="text-sm text-text-muted leading-relaxed">{s.body}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
