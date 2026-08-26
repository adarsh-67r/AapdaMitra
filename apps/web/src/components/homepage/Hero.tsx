"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import LiveMapPreview from "./LiveMapPreview";
import { useAuth } from "@/lib/use-auth";
import { DEMO_CITIZEN, DEMO_AUTHORITY } from "@/lib/demo-accounts";

const fadeUp = {
  hidden: { opacity: 0, y: 14, filter: "blur(8px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)" },
};

export default function Hero() {
  const { login } = useAuth();
  const router = useRouter();
  const [pending, setPending] = useState<"citizen" | "authority" | null>(null);

  async function enterAs(role: "citizen" | "authority") {
    setPending(role);
    try {
      const demo = role === "citizen" ? DEMO_CITIZEN : DEMO_AUTHORITY;
      await login(demo.email, demo.password);
      router.push("/");
    } catch {
      setPending(null);
    }
  }

  return (
    <motion.div
      className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-9 px-6 md:px-10 py-8 md:py-14 items-center min-h-[70vh] md:min-h-[480px]"
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } } }}
    >
      <div>
        <motion.p variants={fadeUp} transition={{ duration: 0.7 }} className="font-mono text-xs tracking-widest text-accent mb-4">
          REAL-TIME DISASTER COORDINATION
        </motion.p>
        <motion.h1 variants={fadeUp} transition={{ duration: 0.7 }} className="text-4xl md:text-5xl font-bold leading-[1.05] tracking-tight mb-5">
          See the whole picture. Dispatch in one click.
        </motion.h1>
        <motion.p variants={fadeUp} transition={{ duration: 0.7 }} className="text-base text-text-muted max-w-[40ch] mb-7">
          Live alerts, citizen reports, and available resources — on one map, updated as it happens.
        </motion.p>
        <motion.div variants={fadeUp} transition={{ duration: 0.7 }} className="flex flex-wrap gap-3.5">
          <motion.button
            type="button"
            onClick={() => enterAs("citizen")}
            disabled={pending !== null}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
            className="inline-flex items-center font-mono text-sm font-semibold px-6 py-3.5 min-h-11 rounded-full bg-accent text-accent-contrast cursor-pointer disabled:opacity-60"
          >
            {pending === "citizen" ? "Entering…" : "Report Incident"}
          </motion.button>
          <button
            type="button"
            onClick={() => enterAs("authority")}
            disabled={pending !== null}
            className="font-mono text-sm px-6 py-3.5 min-h-11 inline-flex items-center rounded-full bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors disabled:opacity-60"
          >
            {pending === "authority" ? "Entering…" : "View Live Map"}
          </button>
        </motion.div>
      </div>

      <motion.div variants={fadeUp} transition={{ duration: 0.7 }}>
        <LiveMapPreview />
      </motion.div>
    </motion.div>
  );
}
