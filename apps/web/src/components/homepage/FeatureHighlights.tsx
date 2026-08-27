"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { EASE_OUT, enter, enterStaggered } from "@/lib/motion";
import TiltCard from "./TiltCard";

const FEATURES = [
  { title: "Citizen reporting", body: "Photo and exact GPS location, filed in under a minute.", status: "Live" as const },
  { title: "Live heatmap dashboard", body: "Authorities see report density and hotspots update in real time.", status: "Live" as const },
  { title: "Nearest-resource dispatch", body: "One click matches and dispatches the closest available team.", status: "Live" as const },
  { title: "SMS / IVR fallback", body: "Reporting and alerts for citizens with no internet access.", status: "Planned" as const },
];

type Feature = (typeof FEATURES)[number];

/**
 * Whether a capability is built or planned is the one thing on the card a judge
 * is actually checking, so it arrives a beat after the card has settled rather
 * than with it — the card is read, then its status lands.
 */
function StatusPill({ status, delay = 0 }: { status: Feature["status"]; delay?: number }) {
  return (
    <motion.span
      initial={{ opacity: 0, transform: "translateY(6px)" }}
      whileInView={{ opacity: 1, transform: "translateY(0px)" }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.24, delay: delay + 0.34, ease: EASE_OUT }}
      className={
        "font-mono text-[0.7rem] tracking-wide mt-4 self-start px-2.5 py-1 " +
        (status === "Live" ? "bg-available/15 text-available" : "bg-medium/15 text-medium")
      }
    >
      {status.toUpperCase()}
    </motion.span>
  );
}

function CardBody({ feature, delay = 0 }: { feature: Feature; delay?: number }) {
  return (
    <>
      <div>
        <h5 className="font-semibold mb-1.5">{feature.title}</h5>
        <p className="text-sm text-text-muted leading-relaxed">{feature.body}</p>
      </div>
      <StatusPill status={feature.status} delay={delay} />
    </>
  );
}

const CARD_CLASS =
"h-full rounded-sm bg-panel border border-border p-5 flex flex-col justify-between min-h-[180px] hover:border-accent/40 transition-colors";

/**
 * Cards deal in like a hand being laid down: each starts lower, rotated and
 * dimmed, then straightens as it reaches its place. The offsets alternate so the
 * row settles into alignment rather than arriving already aligned.
 */
function DealtCard({
  feature,
  index,
  progress,
}: {
  feature: Feature;
  index: number;
  progress: MotionValue<number>;
}) {
  const start = index * 0.12;
  const end = start + 0.45;
  const tilt = index % 2 === 0 ? -4 : 4;

  const y = useTransform(progress, [start, end], [90, 0]);
  const rotate = useTransform(progress, [start, end], [tilt, 0]);
  const opacity = useTransform(progress, [start, start + 0.18], [0, 1]);

  return (
    <motion.div style={{ y, rotate, opacity }}>
      <TiltCard className={CARD_CLASS}>
        <CardBody feature={feature} delay={index * 0.08} />
      </TiltCard>
    </motion.div>
  );
}

export default function FeatureHighlights() {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.9", "end 0.75"] });

  return (
    <div id="features" ref={ref} className="relative z-10 px-6 md:px-10 py-20 scroll-mt-20 overflow-clip">
      <motion.h3 {...enter} className="text-3xl md:text-4xl font-bold tracking-[-0.02em] text-balance mb-8">
        What the system does
      </motion.h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {FEATURES.map((f, i) =>
          reduceMotion ? (
            <motion.div key={f.title} {...enterStaggered(i)}>
              <TiltCard className={CARD_CLASS}>
                <CardBody feature={f} delay={i * 0.08} />
              </TiltCard>
            </motion.div>
          ) : (
            <DealtCard key={f.title} feature={f} index={i} progress={scrollYProgress} />
          )
        )}
      </div>
    </div>
  );
}
