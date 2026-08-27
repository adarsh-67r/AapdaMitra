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
 *
 * Every district in a belt animates identically, so the belt is one animated
 * group rather than 589 independently-animated circles — eight subscriptions to
 * the scroll position instead of well over a thousand.
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
  /** Where the leader line lands, in the same 0–100 space as the points. */
  anchor: { x: number; y: number };
  /** Which way the label runs, so it never leaves the frame. */
  side: "left" | "right";
  /** Trimmed for the callout, where the full sourced line will not fit. */
  short: string;
};

// Belts are geographic approximations for illustration; the figures beside them
// are the published national exposure estimates, not per-district claims.
const BELTS: Belt[] = [
  {
    id: "seismic",
    short: "of India's landmass, Zones III–V",
    label: "Himalayan Belt",
    hazard: "Seismic",
    stat: "59%",
    source: "of India's landmass is earthquake-prone (Zones III–V) — BMTPC",
    color: "var(--high)",
    match: (lat) => lat >= 28,
    anchor: { x: 31, y: 15 },
    side: "right",
  },
  {
    id: "flood",
    short: "flood-prone — about 45M hectares",
    label: "Gangetic Plains",
    hazard: "Flood",
    stat: "12%",
    source: "flood-prone, roughly 45M hectares — NDMA",
    color: "var(--assigned)",
    match: (lat, lng) => lat >= 22 && lat < 28 && lng >= 75,
    anchor: { x: 58, y: 34 },
    side: "right",
  },
  {
    id: "cyclone",
    short: "of the 7,500 km coastline",
    label: "Coastline",
    hazard: "Cyclone",
    stat: "76%",
    source: "of the 7,500 km coastline is cyclone-prone — NDMA",
    color: "var(--medium)",
    match: (lat, lng) => lat < 22 && (lng >= 80 || lng <= 74),
    anchor: { x: 41, y: 55 },
    side: "right",
  },
  {
    id: "drought",
    short: "of cultivable land",
    label: "Deccan Plateau",
    hazard: "Drought",
    stat: "68%",
    source: "of cultivable land is drought-vulnerable — NDMA",
    color: "var(--critical)",
    match: (lat, lng) => lat < 22 && lng > 74 && lng < 80,
    anchor: { x: 27, y: 72 },
    side: "left",
  },
];

// Partition once at module load: every point belongs to at most one belt, and
// whatever matches nothing forms the resting silhouette.
const BELT_POINTS: Point[][] = BELTS.map(() => []);
const REST_POINTS: Point[] = [];
for (const p of PTS) {
  const i = BELTS.findIndex((b) => b.match(p[2], p[3]));
  if (i >= 0) BELT_POINTS[i].push(p);
  else REST_POINTS.push(p);
}

/** Scroll window this belt owns, padded slightly so belts cross-fade. */
function beltRange(index: number) {
  const start = index / BELTS.length;
  const end = (index + 1) / BELTS.length;
  return [Math.max(0, start - 0.05), (start + end) / 2, Math.min(1, end + 0.05)];
}

function BeltLayer({ index, progress }: { index: number; progress: MotionValue<number> }) {
  const belt = BELTS[index];
  const range = beltRange(index);
  // Two layers: the districts themselves, and a wider bloom that blooms only
  // while the belt is the one being read.
  const dots = useTransform(progress, range, [0.2, 1, 0.2]);
  const bloom = useTransform(progress, range, [0, 0.28, 0]);

  return (
    <>
      <motion.g style={{ opacity: bloom }} fill={belt.color}>
        {BELT_POINTS[index].map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r={1.6} />
        ))}
      </motion.g>
      <motion.g style={{ opacity: dots }} fill={belt.color}>
        {BELT_POINTS[index].map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r={0.62} />
        ))}
      </motion.g>
    </>
  );
}

/**
 * A leader line from the belt's centroid out to its figure — so the number is
 * read against the districts it describes, not in a column beside them.
 */
function BeltCallout({ index, progress }: { index: number; progress: MotionValue<number> }) {
  const belt = BELTS[index];
  const range = beltRange(index);
  const opacity = useTransform(progress, range, [0, 1, 0]);
  const draw = useTransform(progress, range, [0, 1, 1]);

  const dir = belt.side === "right" ? 1 : -1;
  // The elbow leaves the landmass, then runs far enough out that the label sits
  // clear of the districts rather than on top of them.
  const elbowX = belt.anchor.x + dir * 16;
  const elbowY = belt.anchor.y - 11;
  const endX = belt.side === "right" ? 108 : -8;
  const anchorAttr = belt.side === "right" ? "start" : "end";
  const textX = endX + dir * 2;

  return (
    <motion.g style={{ opacity }} aria-hidden>
      <circle cx={belt.anchor.x} cy={belt.anchor.y} r={2.8} fill="none" stroke={belt.color} strokeWidth={0.5} />
      <circle cx={belt.anchor.x} cy={belt.anchor.y} r={0.95} fill={belt.color} />
      <motion.path
        d={`M ${belt.anchor.x} ${belt.anchor.y} L ${elbowX} ${elbowY} L ${endX} ${elbowY}`}
        fill="none"
        stroke={belt.color}
        strokeWidth={0.45}
        vectorEffect="non-scaling-stroke"
        style={{ pathLength: draw }}
      />
      {/* Label block sits at the end of the leader, reading outward. */}
      <text
        x={textX}
        y={elbowY - 4.4}
        fill="currentColor"
        className="text-text-muted"
        textAnchor={anchorAttr}
        style={{ fontSize: 2.6, letterSpacing: "0.14em" }}
      >
        {belt.hazard.toUpperCase()} · {belt.label.toUpperCase()}
      </text>
      <text
        x={textX}
        y={elbowY + 4.2}
        fill={belt.color}
        textAnchor={anchorAttr}
        style={{ fontSize: 10, fontWeight: 700, letterSpacing: "-0.04em" }}
      >
        {belt.stat}
      </text>
      <text
        x={textX}
        y={elbowY + 8.6}
        fill="currentColor"
        className="text-text-muted"
        textAnchor={anchorAttr}
        style={{ fontSize: 2.7 }}
      >
        {belt.short}
      </text>
    </motion.g>
  );
}

/** Static fallback — also the accessible text for the animated version. */
function BeltList() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {BELTS.map((b) => (
        <div key={b.id} className="rounded-sm bg-panel border border-border p-5">
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
        <BeltList />
      </div>
    );
  }

  return (
    <div ref={ref} className="relative z-10 h-[360vh]">
      <div className="sticky top-0 h-[100dvh] flex flex-col items-center justify-center px-6 md:px-10">
        <div className="w-full max-w-6xl">
          <svg
            viewBox="-46 -8 192 122"
            className="w-full h-auto max-h-[74vh] mx-auto"
            role="img"
            aria-label="Map of India drawn from 589 district centroids, highlighting seismic, flood, cyclone and drought belts in turn"
          >
            {/* Resting silhouette — the districts no belt claims. */}
            <g fill="var(--text-muted)" opacity={0.18}>
              {REST_POINTS.map((p, i) => (
                <circle key={i} cx={p[0]} cy={p[1]} r={0.5} />
              ))}
            </g>
            {BELTS.map((b, i) => (
              <BeltLayer key={b.id} index={i} progress={scrollYProgress} />
            ))}
            {BELTS.map((b, i) => (
              <BeltCallout key={`c-${b.id}`} index={i} progress={scrollYProgress} />
            ))}
          </svg>

          <p className="text-center font-mono text-[0.68rem] text-text-muted">
            589 districts · plotted from real centroids
          </p>

          {/* The callouts and caption fade in and out of the a11y tree as you
              scroll; this carries the same facts and never moves. */}
          <div className="sr-only">
            <h3>One system, every hazard belt</h3>
            <BeltList />
          </div>
        </div>
      </div>
    </div>
  );
}
