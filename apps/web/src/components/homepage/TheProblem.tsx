"use client";

import { motion } from "framer-motion";

export default function TheProblem() {
  return (
    <div id="problem" className="relative z-10 px-6 md:px-10 py-14 scroll-mt-20">
      <motion.div
        initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 0.6 }}
        className="rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 p-6 md:p-9"
      >
        <p className="font-mono text-xs tracking-widest text-accent mb-4">THE PROBLEM</p>
        <p className="text-lg md:text-xl font-semibold leading-snug max-w-[42ch] mb-4">
          During floods, cyclones, and landslides, help doesn&apos;t fail for lack of caring — it fails for lack of a
          shared picture.
        </p>
        <p className="text-sm md:text-base text-text-muted leading-relaxed max-w-[62ch]">
          Delayed information flow between citizens, NDRF, and local administration leads to poor resource
          allocation and slower rescue response. A citizen&apos;s report, an official alert, and an available
          ambulance can all exist at the same moment — and never reach each other in time. AapdaMitra puts all
          three on one live map, so the decision that used to take a chain of phone calls takes one click.
        </p>
      </motion.div>
    </div>
  );
}
