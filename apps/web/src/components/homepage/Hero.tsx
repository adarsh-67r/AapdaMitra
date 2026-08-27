"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
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
  const heroRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  // The panel travels less than the copy, so the two layers separate in depth
  // as the hero scrolls away.
  const panelY = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : -70]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : 40]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.8], [1, reduceMotion ? 1 : 0.25]);

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
      ref={heroRef}
      className="relative z-10 grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-10 lg:gap-16 px-6 md:px-10 pt-10 pb-16 md:pt-16 md:pb-24 items-center min-h-[86dvh] overflow-x-clip"
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } } }}
    >
      <motion.div style={{ y: copyY, opacity: copyOpacity }}>
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
            className="inline-flex items-center font-mono text-sm font-semibold px-7 py-4 min-h-12 bg-accent text-accent-contrast cursor-pointer disabled:opacity-60 "
          >
            {entering ? "Entering…" : "Report Incident"}
          </motion.button>
          <Link
            href="/map"
            className="font-mono text-sm px-7 py-4 min-h-12 inline-flex items-center bg-panel border border-border hover:bg-panel-alt transition-colors"
          >
            View Live Map
          </Link>
        </motion.div>
      </motion.div>

      <motion.div
        variants={fadeUp}
        transition={heroTransition}
        style={{ y: panelY }}
        className="min-w-0"
      >
        <LiveMapPreview />
      </motion.div>
    </motion.div>
  );
}
