"use client";

import { useRef } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";

/**
 * Tilts toward the pointer in 3D. Tying rotation straight to the cursor feels
 * artificial because it has no mass, so the raw pointer value is run through a
 * spring — the card lags slightly and settles rather than snapping.
 *
 * This is decorative, which is exactly why it's gated: it only runs on devices
 * with a real pointer, and not at all under reduced motion.
 */
export default function TiltCard({
  children,
  className,
  maxTilt = 7,
  flat = false,
}: {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  /**
   * Skip the 3D entirely. `preserve-3d` under a parent whose opacity is being
   * animated, inside a clipped container, is rendered inconsistently across
   * browsers — the card can wash out or ghost. Where a card is already being
   * revealed by scroll, the tilt is not worth that risk.
   */
  flat?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const spring = { stiffness: 220, damping: 22, mass: 0.6 };
  const sx = useSpring(px, spring);
  const sy = useSpring(py, spring);

  const rotateY = useTransform(sx, [0, 1], [-maxTilt, maxTilt]);
  const rotateX = useTransform(sy, [0, 1], [maxTilt, -maxTilt]);

  if (reduceMotion || flat) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ rotateX, rotateY, transformPerspective: 900, transformStyle: "preserve-3d" }}
      onPointerMove={(e) => {
        // Coarse pointers (touch) fire this on tap and would jolt the card.
        if (e.pointerType !== "mouse") return;
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        px.set((e.clientX - r.left) / r.width);
        py.set((e.clientY - r.top) / r.height);
      }}
      onPointerLeave={() => {
        px.set(0.5);
        py.set(0.5);
      }}
    >
      {children}
    </motion.div>
  );
}
