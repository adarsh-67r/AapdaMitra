"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { enter } from "@/lib/motion";

const HEADLINE =
  "During floods, cyclones and landslides, help doesn't fail for lack of caring. It fails for lack of a shared picture.";

const WORDS = HEADLINE.split(" ");
// The two words the sentence turns on.
const EMPHASIS = new Set(["caring.", "picture."]);

// Unread words are ink at low strength, not near-transparent. On a paper ground
// the previous 0.16 floor was effectively invisible, so most of the sentence
// looked broken rather than pending — and by the time it filled in, the reader
// had already scrolled past it.
const UNREAD = 0.24;

function Word({ word, index, progress }: { word: string; index: number; progress: MotionValue<number> }) {
  // The fill occupies the middle of the pinned range: a beat to arrive, the
  // sentence filling word by word, then a beat to read it whole before release.
  const span = 0.62 / WORDS.length;
  const start = 0.16 + index * span;
  const opacity = useTransform(progress, [start, start + span * 2.2], [UNREAD, 1]);

  return (
    <motion.span style={{ opacity }} className={EMPHASIS.has(word) ? "text-accent" : undefined}>
      {word}{" "}
    </motion.span>
  );
}

export default function TheProblem() {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  const body = (
    <p className="text-sm md:text-base text-text-muted leading-relaxed max-w-[62ch]">
      Delayed information flow between citizens, NDRF and local administration leads to poor resource
      allocation and slower rescue response. A citizen&apos;s report, an official alert, and an available
      ambulance can all exist at the same moment — and never reach each other in time.
    </p>
  );

  // Pinning and scroll-scrubbed text are exactly what a motion-sensitive reader
  // asked not to see. Same words, delivered as an ordinary block.
  if (reduceMotion) {
    return (
      <section id="problem" className="relative z-10 px-6 md:px-10 py-20 scroll-mt-20">
        <motion.div {...enter} className="max-w-4xl">
          <p className="font-mono text-xs tracking-[0.2em] text-accent mb-6">THE PROBLEM</p>
          <p className="text-3xl md:text-5xl font-semibold leading-[1.18] tracking-[-0.025em] text-balance mb-8">
            {HEADLINE}
          </p>
          {body}
        </motion.div>
      </section>
    );
  }

  return (
    <section id="problem" ref={ref} className="relative z-10 h-[240vh] scroll-mt-20">
      <div className="sticky top-0 h-[100dvh] flex items-center px-6 md:px-10">
        <div className="w-full max-w-5xl">
          <p className="font-mono text-xs tracking-[0.2em] text-accent mb-6">THE PROBLEM</p>
          <p
            className="text-3xl md:text-5xl lg:text-6xl font-semibold leading-[1.15] tracking-[-0.03em] max-w-[20ch] mb-10"
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
      </div>
    </section>
  );
}
