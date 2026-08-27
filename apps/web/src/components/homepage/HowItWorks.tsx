"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { enter, enterStaggered } from "@/lib/motion";

const STEPS = [
  {
    n: "01",
    title: "Report",
    body: "A citizen files a report with a photo and exact location, no login friction.",
    accent: "var(--medium)",
  },
  {
    n: "02",
    title: "See it live",
    body: "Authorities see it land on the map instantly, alongside every available resource nearby.",
    accent: "var(--accent)",
  },
  {
    n: "03",
    title: "Dispatch",
    body: "One click sends the nearest available team — ambulance, rescue, or shelter — to the exact spot.",
    accent: "var(--assigned)",
  },
];

/**
 * One step of the pinned sequence. Each step owns a third of the scroll
 * distance: it rises in, holds while it is "current", then recedes — so the
 * three steps read as one continuous handoff rather than three cards.
 */
function Step({
  step,
  index,
  progress,
}: {
  step: (typeof STEPS)[number];
  index: number;
  progress: MotionValue<number>;
}) {
  const start = index / STEPS.length;
  const end = (index + 1) / STEPS.length;
  const mid = (start + end) / 2;

  // Keyframe offsets must be monotonically non-decreasing and inside [0, 1] —
  // the earlier version padded the first step's range to -0.08, which the Web
  // Animations API rejects outright.
  const from = Math.max(0, start - 0.08);
  const to = Math.min(1, end + 0.02);
  const range = [from, mid, to];

  const opacity = useTransform(progress, range, [0, 1, 0]);
  const x = useTransform(progress, range, [70, 0, -70]);
  const scale = useTransform(progress, range, [0.94, 1, 0.94]);

  return (
    <motion.div
      style={{ opacity, x, scale }}
      className="absolute inset-0 flex gap-5 md:gap-8 items-center"
    >
      <span
        className="font-mono text-5xl md:text-8xl font-bold shrink-0 leading-none opacity-25"
        style={{ color: step.accent }}
        aria-hidden
      >
        {step.n}
      </span>
      <div>
        <h4 className="text-3xl md:text-6xl font-bold tracking-[-0.03em] mb-3">{step.title}</h4>
        <p className="text-base md:text-xl text-text-muted leading-relaxed max-w-[42ch]">{step.body}</p>
      </div>
    </motion.div>
  );
}

/** The rail fills as the sequence advances — a read-out of scroll position. */
function Rail({ progress }: { progress: MotionValue<number> }) {
  const scaleX = useTransform(progress, [0, 1], [0, 1]);
  return (
    <div className="absolute left-0 right-0 bottom-0 h-px bg-white/10">
      <motion.div className="absolute inset-y-0 left-0 w-full origin-left bg-accent" style={{ scaleX }} />
    </div>
  );
}

export default function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  // Pinning and scroll-scrubbing are exactly the kind of motion a
  // motion-sensitive user asked not to see. Fall back to the same content as a
  // plain stacked list with the ordinary reveal the rest of the page uses.
  if (reduceMotion) {
    return (
      <div id="how-it-works" className="relative z-10 px-6 md:px-10 py-14 scroll-mt-20">
        <motion.h3 {...enter} className="text-3xl md:text-4xl font-bold tracking-[-0.02em] text-balance mb-8">
          How it works
        </motion.h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              {...enterStaggered(i)}
              className="rounded-sm bg-panel border border-border p-5"
            >
              <div className="font-mono text-xs" style={{ color: s.accent }}>
                {s.n}
              </div>
              <h4 className="font-semibold mt-2.5 mb-1.5">{s.title}</h4>
              <p className="text-sm text-text-muted leading-relaxed">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div id="how-it-works" ref={ref} className="relative z-10 h-[280vh] scroll-mt-20">
      <div className="sticky top-0 h-[100dvh] flex items-center px-6 md:px-10">
        <div className="relative w-full max-w-5xl mx-auto pb-10">
          <p className="font-mono text-[0.7rem] tracking-[0.2em] text-accent mb-8">HOW IT WORKS</p>
          <div className="relative h-[300px] md:h-[280px] overflow-hidden">
            {STEPS.map((s, i) => (
              <Step key={s.n} step={s} index={i} progress={scrollYProgress} />
            ))}
          </div>
          <Rail progress={scrollYProgress} />
        </div>
      </div>
    </div>
  );
}
