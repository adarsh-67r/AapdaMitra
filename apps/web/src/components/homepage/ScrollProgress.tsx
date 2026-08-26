"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/**
 * Thin read-out of how far through the page the visitor is. Spring-smoothed so
 * it glides rather than tracking the wheel's stutter 1:1 — critically damped,
 * because scroll position should settle, not overshoot.
 *
 * Opacity-only under reduced motion is handled by the CSS below; the bar itself
 * is a scaleX transform, which is compositor-only.
 */
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 260, damping: 40, restDelta: 0.001 });

  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed top-0 inset-x-0 h-[3px] bg-accent origin-left z-50 motion-reduce:hidden"
    />
  );
}
