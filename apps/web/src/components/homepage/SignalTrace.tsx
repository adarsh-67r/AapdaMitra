"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";

/**
 * A signal travelling down the page.
 *
 * The argument the homepage makes is that a report, an alert and a resource have
 * to reach each other. So the page carries one continuous line down its left
 * edge with a lit head that advances as you scroll, and a node that flares at
 * each section boundary as the signal reaches it — arriving at the sections
 * rather than decorating them.
 *
 * Purely decorative, so it is aria-hidden, sits behind the content, and is not
 * rendered at all for a reader who asked for reduced motion.
 */

/** Section anchors the signal reports passing, in document order. */
const STOPS = ["problem", "hazard-map", "how-it-works", "features", "capabilities"];

interface Stop {
  id: string;
  /** Vertical position down the traced range, 0–1. */
  at: number;
}

export default function SignalTrace() {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const [stops, setStops] = useState<Stop[]>([]);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  // The head lags the scroll slightly, so it reads as something travelling
  // rather than something pinned to the scrollbar.
  const head = useSpring(scrollYProgress, { stiffness: 90, damping: 26, restDelta: 0.0005 });

  // Anchor positions are measured from the DOM rather than hardcoded, so the
  // nodes stay correct when section heights change.
  useEffect(() => {
    if (reduceMotion) return;
    const measure = () => {
      const host = ref.current;
      if (!host) return;
      const top = host.offsetTop;
      const height = host.offsetHeight;
      if (height <= 0) return;
      setStops(
        STOPS.map((id) => {
          const el = document.getElementById(id);
          if (!el) return null;
          const centre = el.offsetTop + el.offsetHeight / 2 - top;
          return { id, at: Math.min(Math.max(centre / height, 0), 1) };
        }).filter((s): s is Stop => s !== null)
      );
    };
    measure();
    window.addEventListener("resize", measure);
    // Fonts and images settle after first paint and move everything down.
    const settle = window.setTimeout(measure, 600);
    return () => {
      window.removeEventListener("resize", measure);
      window.clearTimeout(settle);
    };
  }, [reduceMotion]);

  if (reduceMotion) return <div ref={ref} className="absolute inset-0 pointer-events-none" aria-hidden />;

  return (
    <div ref={ref} className="absolute inset-0 z-0 pointer-events-none" aria-hidden>
      <div className="sticky top-0 h-[100dvh]">
        <div className="absolute left-3 md:left-5 top-0 bottom-0 w-px bg-border" />
      </div>

      {/* The traced line and its nodes span the whole page, not the viewport. */}
      <div className="absolute left-3 md:left-5 top-0 bottom-0 w-px">
        <motion.div
          className="absolute inset-x-0 top-0 origin-top bg-accent"
          style={{ height: "100%", scaleY: head }}
        />
        {stops.map((stop) => (
          <Node key={stop.id} at={stop.at} head={head} />
        ))}
      </div>
    </div>
  );
}

function Node({ at, head }: { at: number; head: ReturnType<typeof useSpring> }) {
  // Each node lights as the head passes it and stays lit, so the line reads as
  // a route already travelled rather than a row of blinking dots.
  const lit = useTransform(head, [at - 0.02, at + 0.01], [0, 1]);
  const flare = useTransform(head, [at - 0.02, at, at + 0.05], [0, 1, 0]);
  const flareScale = useTransform(flare, [0, 1], [0.4, 1.6]);

  return (
    <div className="absolute -left-[3.5px] w-2 h-2" style={{ top: `${at * 100}%` }}>
      <motion.span
        className="absolute inset-0 rounded-full bg-accent"
        style={{ opacity: lit }}
      />
      <motion.span
        className="absolute -inset-2 rounded-full border border-accent"
        style={{ opacity: flare, scale: flareScale }}
      />
    </div>
  );
}
