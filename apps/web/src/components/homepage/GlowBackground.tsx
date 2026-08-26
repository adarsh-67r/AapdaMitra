"use client";

import { motion } from "framer-motion";

const BLOBS = [
  { color: "var(--accent)", size: 420, style: { top: "-120px", left: "-80px" }, opacity: 0.35, dx: 30, dy: 20, duration: 14 },
  { color: "var(--high)", size: 380, style: { bottom: "-140px", right: "-60px" }, opacity: 0.22, dx: -25, dy: -15, duration: 17 },
  { color: "var(--assigned)", size: 300, style: { top: "30%", right: "15%" }, opacity: 0.18, dx: 15, dy: -25, duration: 12 },
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
            filter: "blur(70px)",
            ...b.style,
          }}
          animate={{ x: [0, b.dx, 0], y: [0, b.dy, 0] }}
          transition={{ duration: b.duration, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}
