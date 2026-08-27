"use client";

import { useRef, useState } from "react";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { enter, enterStaggered } from "@/lib/motion";
import TiltCard from "./TiltCard";
import FeatureGlyph, { type GlyphKind } from "./FeatureGlyph";

const FEATURES = [
  {
    title: "Citizen reporting",
    body: "Photo and exact GPS location, filed in under a minute.",
    status: "Live" as const,
    glyph: "report" as GlyphKind,
  },
  {
    title: "Live heatmap dashboard",
    body: "Authorities see report density and hotspots update in real time.",
    status: "Live" as const,
    glyph: "heatmap" as GlyphKind,
  },
  {
    title: "Nearest-resource dispatch",
    body: "One click matches and dispatches the closest available team.",
    status: "Live" as const,
    glyph: "dispatch" as GlyphKind,
  },
  {
    title: "SMS / IVR fallback",
    body: "Reporting and alerts for citizens with no internet access.",
    status: "Planned" as const,
    glyph: "fallback" as GlyphKind,
  },
];

type Feature = (typeof FEATURES)[number];

/**
 * Scroll window each capability owns.
 *
 * Deliberately tight. With a wider window the four arrivals consumed 90% of the
 * section and all four were only on screen together for the final 10% — about
 * 11vh of scrolling — before the pin released and the whole thing scrolled away.
 * The point of the section is the complete set, so the sequence finishes around
 * halfway and the rest of the scroll holds all four, settled and equal.
 */
const SPAN = 0.13;
/** How far into its window a card has fully arrived — its diagram starts after. */
const ARRIVED = 0.1;

const CARD_CLASS =
  "h-full rounded-sm bg-panel border border-border p-5 flex flex-col justify-between min-h-[220px] transition-colors";

function StatusPill({ status }: { status: Feature["status"] }) {
  return (
    <span
      className={
        "font-mono text-[0.7rem] tracking-wide mt-4 self-start px-2.5 py-1 " +
        (status === "Live" ? "bg-available/15 text-available" : "bg-medium/15 text-medium")
      }
    >
      {status.toUpperCase()}
    </span>
  );
}

function CardBody({
  feature,
  progress,
  start,
}: {
  feature: Feature;
  progress?: MotionValue<number>;
  start?: number;
}) {
  return (
    <>
      <div>
        <FeatureGlyph kind={feature.glyph} progress={progress} start={start} />
        <h5 className="font-semibold mb-1.5">{feature.title}</h5>
        <p className="text-sm text-text-muted leading-relaxed">{feature.body}</p>
      </div>
      <StatusPill status={feature.status} />
    </>
  );
}

/**
 * One capability arriving as the section is scrolled.
 *
 * It rises into place and stays at full strength. This is a list of four things
 * the product does: by the end all four are present and equal, because a reader
 * comparing them should not have three of them dimmed. Dimming the earlier ones
 * to spotlight the newest was tried and removed — it made the section feel like
 * it was taking capabilities away as it went.
 *
 * Everything is a pure function of scroll position, so scrolling back up plays
 * the arrivals in reverse with no extra state.
 */
function ScrollCard({
  feature,
  index,
  progress,
}: {
  feature: Feature;
  index: number;
  progress: MotionValue<number>;
}) {
  const start = index * SPAN;

  const y = useTransform(progress, [start, start + ARRIVED], [56, 0]);
  const opacity = useTransform(progress, [start, start + ARRIVED * 0.7], [0, 1]);

  return (
    <motion.div style={{ y, opacity }} className="h-full">
      <TiltCard className={CARD_CLASS}>
        <CardBody feature={feature} progress={progress} start={start} />
      </TiltCard>
    </motion.div>
  );
}

/** Which capability is being introduced, as a row of segments. */
function Ticks({ index }: { index: number }) {
  return (
    <div className="flex gap-1.5 mt-6" aria-hidden>
      {FEATURES.map((f, i) => (
        <span
          key={f.title}
          className={
            "h-0.5 flex-1 transition-colors duration-300 " +
            (i === index ? "bg-accent" : "bg-border")
          }
        />
      ))}
    </div>
  );
}

export default function FeatureHighlights() {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [active, setActive] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const next = Math.min(FEATURES.length - 1, Math.max(0, Math.floor(v / SPAN)));
    setActive((prev) => (prev === next ? prev : next));
  });

  // Pinning and scroll-scrubbed diagrams are exactly what a motion-sensitive
  // reader asked not to see. Same four capabilities as an ordinary grid, each
  // diagram already drawn.
  if (reduceMotion) {
    return (
      <div id="features" className="relative z-10 px-6 md:px-10 py-20 scroll-mt-20">
        <motion.h3
          {...enter}
          className="text-3xl md:text-4xl font-bold tracking-[-0.02em] text-balance mb-8"
        >
          What the system does
        </motion.h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title} {...enterStaggered(i)}>
              <TiltCard className={CARD_CLASS}>
                <CardBody feature={f} />
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div id="features" ref={ref} className="relative z-10 h-[240vh] scroll-mt-20">
      <div className="sticky top-0 h-[100dvh] flex flex-col justify-center px-6 md:px-10 py-10 overflow-clip">
        <p className="font-mono text-xs tracking-[0.2em] text-accent mb-3">WHAT THE SYSTEM DOES</p>
        <h3 className="text-3xl md:text-5xl font-bold tracking-[-0.025em] text-balance mb-6 max-w-[20ch]">
          Four capabilities, end to end
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 flex-1 min-h-0 max-h-[58vh]">
          {FEATURES.map((f, i) => (
            <ScrollCard key={f.title} feature={f} index={i} progress={scrollYProgress} />
          ))}
        </div>
        <Ticks index={active} />
      </div>
    </div>
  );
}
