"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import LiveMapPreview from "./LiveMapPreview";
import { useAuth } from "@/lib/use-auth";
import { EASE_OUT } from "@/lib/motion";
import { DEMO_CITIZEN } from "@/lib/demo-accounts";

// The hero is the one authored entrance on the page — it keeps the blur-in that
// the quieter section reveals deliberately drop.
const fadeUp = {
  hidden: { opacity: 0, y: 14, filter: "blur(8px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)" },
};

const heroTransition = { duration: 0.7, ease: EASE_OUT } as const;

export default function Hero() {
  const { login } = useAuth();
  const router = useRouter();
  const [entering, setEntering] = useState(false);

  async function reportIncident() {
    setEntering(true);
    try {
      await login(DEMO_CITIZEN.email, DEMO_CITIZEN.password);
      router.push("/");
    } catch {
      setEntering(false);
    }
  }

  return (
    <motion.div
      className="relative z-10 grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-10 lg:gap-16 px-6 md:px-10 pt-10 pb-16 md:pt-16 md:pb-24 items-center min-h-[86dvh] overflow-x-clip"
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } } }}
    >
      <div>
        <motion.p variants={fadeUp} transition={heroTransition} className="font-mono text-[0.7rem] tracking-[0.2em] text-accent mb-5">
          REAL-TIME DISASTER COORDINATION
        </motion.p>
        <motion.h1 variants={fadeUp} transition={heroTransition} className="text-[2.75rem] leading-[0.95] sm:text-6xl lg:text-7xl xl:text-[5.25rem] font-bold tracking-[-0.035em] text-balance mb-6">
          Disasters don&apos;t wait. Neither should help.
        </motion.h1>
        <motion.p variants={fadeUp} transition={heroTransition} className="text-base md:text-lg text-text-muted max-w-[46ch] leading-relaxed mb-9">
          AapdaMitra puts live alerts, citizen reports, and nearby resources on one map — so the nearest team gets
          dispatched in the time it takes to click, not call.
        </motion.p>
        <motion.div variants={fadeUp} transition={heroTransition} className="flex flex-wrap gap-3.5">
          <motion.button
            type="button"
            onClick={reportIncident}
            disabled={entering}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            // Critically damped: a hover carries no momentum, so the button
            // should settle rather than overshoot. Bounce is reserved for
            // motion the user actually threw.
            transition={{ type: "spring", bounce: 0, duration: 0.35 }}
            className="inline-flex items-center font-mono text-sm font-semibold px-7 py-4 min-h-12 rounded-full bg-accent text-accent-contrast cursor-pointer disabled:opacity-60 shadow-[0_12px_36px_-12px_var(--accent)]"
          >
            {entering ? "Entering…" : "Report Incident"}
          </motion.button>
          <Link
            href="/map"
            className="font-mono text-sm px-7 py-4 min-h-12 inline-flex items-center rounded-full bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors"
          >
            View Live Map
          </Link>
        </motion.div>
      </div>

      <motion.div
        variants={fadeUp}
        transition={heroTransition}
        className="min-w-0"
      >
        <LiveMapPreview />
      </motion.div>
    </motion.div>
  );
}
