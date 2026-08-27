"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { enter } from "@/lib/motion";

const HEADLINE =
  "During floods, cyclones and landslides, help doesn't fail for lack of caring. It fails for lack of a shared picture.";

const WORDS = HEADLINE.split(" ");
// The two words the sentence turns on.
const EMPHASIS = new Set(["caring.", "picture."]);

function Word({ word, index, progress }: { word: string; index: number; progress: MotionValue<number> }) {
  // Words brighten in sequence across the first two-thirds of the scroll, so
  // the sentence is read at the pace it is revealed.
  const start = (index / WORDS.length) * 0.66;
  const end = start + 0.12;
  const opacity = useTransform(progress, [start, end], [0.16, 1]);
  const emphasised = EMPHASIS.has(word);

  return (
    <motion.span style={{ opacity }} className={emphasised ? "text-accent" : undefined}>
      {word}{" "}
    </motion.span>
  );
}

export default function TheProblem() {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.4"] });

  const body = (
    <p className="text-sm md:text-base text-text-muted leading-relaxed max-w-[62ch]">
      Delayed information flow between citizens, NDRF and local administration leads to poor resource
      allocation and slower rescue response. A citizen&apos;s report, an official alert, and an available
      ambulance can all exist at the same moment — and never reach each other in time.
    </p>
  );

  if (reduceMotion) {
    return (
      <div id="problem" className="relative z-10 px-6 md:px-10 py-14 scroll-mt-20">
        <motion.div
          {...enter}
          className="rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 p-6 md:p-9"
        >
          <p className="font-mono text-xs tracking-widest text-accent mb-4">THE PROBLEM</p>
          <p className="text-2xl md:text-4xl font-bold leading-[1.15] tracking-[-0.02em] max-w-[24ch] mb-6">
            {HEADLINE}
          </p>
          {body}
        </motion.div>
      </div>
    );
  }

  return (
    <div id="problem" ref={ref} className="relative z-10 px-6 md:px-10 py-24 md:py-32 scroll-mt-20">
      <p className="font-mono text-xs tracking-[0.2em] text-accent mb-6">THE PROBLEM</p>
      <p
        className="text-2xl md:text-4xl lg:text-5xl font-bold leading-[1.2] tracking-[-0.025em] max-w-[22ch] mb-8"
        aria-label={HEADLINE}
      >
        <span aria-hidden>
          {WORDS.map((w, i) => (
            <Word key={i} word={w} index={i} progress={scrollYProgress} />
          ))}
        </span>
      </p>
      {body}
    </div>
  );
}
