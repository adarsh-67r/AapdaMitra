"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";

/**
 * Counts a number up when it scrolls into view. Splits a value like "12s" or
 * "24/7" into the leading number and whatever trails it, so only the digits
 * animate and the unit stays put.
 *
 * Counting is decorative, so it defers entirely under reduced motion — the
 * final value renders immediately.
 */
export default function CountUp({ value, durationMs = 900 }: { value: string; durationMs?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  const reduceMotion = useReducedMotion();

  const match = /^(\d+(?:\.\d+)?)(.*)$/.exec(value);
  const target = match ? parseFloat(match[1]) : null;
  const suffix = match ? match[2] : "";
  const decimals = match && match[1].includes(".") ? match[1].split(".")[1].length : 0;

  const [display, setDisplay] = useState(target === null || reduceMotion ? value : `0${suffix}`);

  useEffect(() => {
    if (target === null || reduceMotion) {
      setDisplay(value);
      return;
    }
    if (!inView) return;

    let raf = 0;
    const started = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - started) / durationMs);
      // Ease-out so it decelerates into the final number instead of stopping dead.
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(`${(target * eased).toFixed(decimals)}${suffix}`);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, target, suffix, decimals, durationMs, reduceMotion, value]);

  return (
    <span ref={ref} className="tabular-nums">
      {display}
    </span>
  );
}
