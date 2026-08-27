"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import POINTS from "@/lib/india-points.json";

/**
 * India drawn from its own 589 district centroids — the same coordinate data the
 * alert ingestion places warnings against — rather than a traced outline. As the
 * section is scrolled, each hazard belt lights the districts that fall inside it
 * and states the exposure figure for that hazard.
 *
 * Points are pre-projected into the 0–100 viewBox at build time
 * (src/lib/india-points.json): [x, y, lat, lng].
 */
type Point = [number, number, number, number];
const PTS = POINTS as Point[];

type Belt = {
  id: string;
  label: string;
  hazard: string;
  stat: string;
  source: string;
  color: string;
  /** Districts inside the belt, judged on real lat/lng. */
  match: (lat: number, lng: number) => boolean;
};

// Belts are geographic approximations for illustration; the figures beside them
// are the published national exposure estimates, not per-district claims.
const BELTS: Belt[] = [
  {
    id: "seismic",
    label: "Himalayan Belt",
    hazard: "Seismic",
    stat: "59%",
    source: "of India's landmass is earthquake-prone (Zones III–V) — BMTPC",
    color: "var(--high)",
    match: (lat) => lat >= 28,
  },
  {
    id: "flood",
    label: "Gangetic Plains",
    hazard: "Flood",
    stat: "12%",
    source: "flood-prone, roughly 45M hectares — NDMA",
    color: "var(--assigned)",
    match: (lat, lng) => lat >= 22 && lat < 28 && lng >= 75,
  },
  {
    id: "cyclone",
    label: "Coastline",
    hazard: "Cyclone",
    stat: "76%",
    source: "of the 7,500 km coastline is cyclone-prone — NDMA",
    color: "var(--medium)",
    match: (lat, lng) => lat < 22 && (lng >= 80 || lng <= 74),
  },
  {
    id: "drought",
    label: "Deccan Plateau",
    hazard: "Drought",
    stat: "68%",
    source: "of cultivable land is drought-vulnerable — NDMA",
    color: "var(--critical)",
    match: (lat, lng) => lat < 22 && lng > 74 && lng < 80,
  },
];

// Resolve belt membership once rather than per scroll frame.
const BELT_MEMBERS: Record<string, boolean[]> = Object.fromEntries(
  BELTS.map((b) => [b.id, PTS.map((p) => b.match(p[2], p[3]))])
);

function Dot({
  point,
  index,
  progress,
}: {
  point: Point;
  index: number;
  progress: MotionValue<number>;
}) {
  const [x, y] = point;
  const beltIndex = BELTS.findIndex((b) => BELT_MEMBERS[b.id][index]);
  const active = beltIndex >= 0;

  // Each belt owns a slice of the scroll; a dot brightens while its belt is up.
  const start = active ? beltIndex / BELTS.length : 0;
  const end = active ? (beltIndex + 1) / BELTS.length : 0;

  const opacity = useTransform(
    progress,
    active ? [Math.max(0, start - 0.05), (start + end) / 2, Math.min(1, end + 0.05)] : [0, 1],
    active ? [0.18, 1, 0.18] : [0.18, 0.18]
  );
  const r = useTransform(
    progress,
    active ? [Math.max(0, start - 0.05), (start + end) / 2, Math.min(1, end + 0.05)] : [0, 1],
    active ? [0.42, 0.95, 0.42] : [0.42, 0.42]
  );

  return (
    <motion.circle
      cx={x}
      cy={y}
      r={r}
      style={{ opacity }}
      fill={active ? BELTS[beltIndex].color : "var(--text-muted)"}
    />
  );
}

function BeltPanel({ belt, index, progress }: { belt: Belt; index: number; progress: MotionValue<number> }) {
  const start = index / BELTS.length;
  const end = (index + 1) / BELTS.length;
  const range = [Math.max(0, start - 0.05), (start + end) / 2, Math.min(1, end + 0.05)];

  const opacity = useTransform(progress, range, [0, 1, 0]);
  const y = useTransform(progress, range, [28, 0, -28]);

  return (
    <motion.div style={{ opacity, y }} className="absolute inset-x-0 top-0">
      <div className="font-mono text-[0.7rem] tracking-[0.2em] mb-3" style={{ color: belt.color }}>
        {belt.hazard.toUpperCase()} · {belt.label.toUpperCase()}
      </div>
      <div className="text-6xl md:text-7xl font-bold tracking-[-0.03em] mb-3" style={{ color: belt.color }}>
        {belt.stat}
      </div>
      <p className="text-sm md:text-base text-text-muted leading-relaxed max-w-[34ch]">{belt.source}</p>
    </motion.div>
  );
}

export default function IndiaHazardMap() {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  if (reduceMotion) {
    return (
      <div className="relative z-10 px-6 md:px-10 py-14">
        <h3 className="text-3xl md:text-4xl font-bold tracking-[-0.02em] text-balance mb-8 max-w-[26ch]">
          One system, every hazard belt
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {BELTS.map((b) => (
            <div key={b.id} className="rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 p-5">
              <div className="font-mono text-xs mb-2" style={{ color: b.color }}>
                {b.hazard.toUpperCase()} · {b.label.toUpperCase()}
              </div>
              <div className="text-4xl font-bold mb-2" style={{ color: b.color }}>
                {b.stat}
              </div>
              <p className="text-sm text-text-muted leading-relaxed">{b.source}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative z-10 h-[340vh]">
      <div className="sticky top-0 h-[100dvh] flex items-center px-6 md:px-10">
        <div className="w-full grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-10 lg:gap-16 items-center">
          <div className="relative min-h-[260px] md:min-h-[300px] order-2 lg:order-1">
            {BELTS.map((b, i) => (
              <BeltPanel key={b.id} belt={b} index={i} progress={scrollYProgress} />
            ))}
          </div>

          <div className="order-1 lg:order-2">
            <svg
              viewBox="-4 -4 108 108"
              className="w-full h-auto max-h-[52vh] mx-auto"
              role="img"
              aria-label="Map of India drawn from district centroids, highlighting hazard belts"
            >
              {PTS.map((p, i) => (
                <Dot key={i} point={p} index={i} progress={scrollYProgress} />
              ))}
            </svg>
            <p className="text-center font-mono text-[0.68rem] text-text-muted mt-3">
              589 districts · plotted from real centroids
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
