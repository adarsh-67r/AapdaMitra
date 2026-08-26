"use client";

import { motion } from "framer-motion";

const BLOBS = [
  { color: "var(--accent)", size: 620, style: { top: "-180px", left: "-140px" }, opacity: 0.5, dx: 30, dy: 20, duration: 14 },
  { color: "var(--high)", size: 560, style: { bottom: "-200px", right: "-120px" }, opacity: 0.34, dx: -25, dy: -15, duration: 17 },
  { color: "var(--assigned)", size: 420, style: { top: "26%", right: "12%" }, opacity: 0.26, dx: 15, dy: -25, duration: 12 },
];

export default function GlowBackground() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {BLOBS.map((b, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: b.size,
            height: b.size,
            background: b.color,
            opacity: b.opacity,
            filter: "blur(90px)",
            ...b.style,
          }}
          animate={{
            transform: [
              "translate(0px, 0px)",
              `translate(${b.dx}px, ${b.dy}px)`,
              "translate(0px, 0px)",
            ],
          }}
          transition={{ duration: b.duration, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}
