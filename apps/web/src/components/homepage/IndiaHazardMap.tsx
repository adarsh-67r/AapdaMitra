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
    match: (lat, lng) => lat >= 28 && lng < 88,
  },
  {
    id: "flood",
    short: "flood-prone — about 45M hectares",
    label: "Gangetic Plains",
    hazard: "Flood",
    stat: "12%",
    source: "flood-prone, roughly 45M hectares — NDMA",
    color: "var(--assigned)",
    match: (lat, lng) => lat >= 22 && lat < 28 && lng >= 75 && lng <= 88,
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
  },
  {
    id: "landslide",
    short: "km sq of land is landslide-prone",
    label: "Eastern Hills & Western Ghats",
    hazard: "Landslide",
    stat: "0.42M",
    source: "square kilometres, about 12.6% of the land area, is landslide-prone — NDMA",
    color: "var(--available)",
    match: (lat, lng) => lng > 88 || (lat >= 8 && lat <= 21 && lng > 74 && lng <= 76.5),
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

const TOTAL_DISTRICTS = PTS.length;

/**
 * Each belt is anchored on the centroid of the districts it actually claims,
 * measured rather than hand-placed, so a leader line always points at the middle
 * of what it describes and stays correct if a belt definition is changed. The
 * district count beside each figure is real too: it is how many of our own
 * centroids fall in the band, not an estimate.
 */
const VIEW = BELTS.map((belt, i) => {
  const pts = BELT_POINTS[i];
  const x = pts.reduce((acc, q) => acc + q[0], 0) / (pts.length || 1);
  const y = pts.reduce((acc, q) => acc + q[1], 0) / (pts.length || 1);
  return {
    ...belt,
    anchor: { x, y },
    side: (x > 50 ? "right" : "left") as "left" | "right",
    districts: pts.length,
  };
});

/** Scroll window this belt owns, padded slightly so belts cross-fade. */
function beltRange(index: number) {
  const start = index / BELTS.length;
  const end = (index + 1) / BELTS.length;
  return [Math.max(0, start - 0.05), (start + end) / 2, Math.min(1, end + 0.05)];
}

function BeltLayer({ index, progress }: { index: number; progress: MotionValue<number> }) {
  const belt = VIEW[index];
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
  const belt = VIEW[index];
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
      <text
        x={textX}
        y={elbowY + 12.6}
        fill="currentColor"
        className="text-text-muted"
        textAnchor={anchorAttr}
        style={{ fontSize: 2.4, letterSpacing: "0.08em" }}
      >
        {belt.districts} OF {TOTAL_DISTRICTS} DISTRICTS IN THIS BAND
      </text>
    </motion.g>
  );
}

/** The phone readout: the same figures as text, above a full-width map. */
function BeltReadout({ index }: { index: number }) {
  const belt = VIEW[index];
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono text-[0.65rem] tracking-[0.16em] text-text-muted uppercase">
        {belt.hazard} · {belt.label}
      </span>
      <span
        className="text-5xl font-bold tracking-[-0.04em] leading-none"
        style={{ color: belt.color }}
      >
        {belt.stat}
      </span>
      <span className="text-sm text-text-muted leading-snug">{belt.short}</span>
      <span className="font-mono text-[0.65rem] text-text-muted tabular-nums">
        {belt.districts} of {TOTAL_DISTRICTS} districts in this band
      </span>
    </div>
  );
}

/** Which belt is being read, as a row of segments. */
function BeltTicks({ index }: { index: number }) {
  return (
    <div className="flex gap-1.5" aria-hidden>
      {VIEW.map((b, i) => (
        <span
          key={b.id}
          className="h-0.5 flex-1 transition-colors duration-300"
          style={{ background: i === index ? b.color : "var(--border)" }}
        />
      ))}
    </div>
  );
}

/** Static fallback — also the accessible text for the animated version. */
function BeltList() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {VIEW.map((b) => (
        <div key={b.id} className="panel p-5">
          <div className="font-mono text-xs mb-2" style={{ color: b.color }}>
            {b.hazard.toUpperCase()} · {b.label.toUpperCase()}
          </div>
          <div className="text-4xl font-bold mb-2" style={{ color: b.color }}>
            {b.stat}
          </div>
          <p className="text-sm text-text-muted leading-relaxed">{b.source}</p>
          <p className="font-mono text-xs text-text-muted mt-2 tabular-nums">
            {b.districts} of {TOTAL_DISTRICTS} districts in this band
          </p>
        </div>
      ))}
    </div>
  );
}

export default function IndiaHazardMap() {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [active, setActive] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const next = Math.min(VIEW.length - 1, Math.max(0, Math.floor(v * VIEW.length)));
    setActive((prev) => (prev === next ? prev : next));
  });

  if (reduceMotion) {
    return (
      <div id="hazard-map" className="relative z-10 px-6 md:px-10 py-14">
        <h3 className="text-3xl md:text-4xl font-bold tracking-[-0.02em] text-balance mb-8 max-w-[26ch]">
          One system, every hazard belt
        </h3>
        <BeltList />
      </div>
    );
  }

  const label =
    `Map of India drawn from ${TOTAL_DISTRICTS} district centroids, highlighting the ` +
    VIEW.map((b) => b.hazard.toLowerCase()).join(", ") +
    " belts in turn";

  return (
    <div id="hazard-map" ref={ref} className="relative z-10 h-[440vh]">
      <div className="sticky top-0 h-[100dvh] flex flex-col justify-center px-4 md:px-10 py-6">
        {/* Phone: the figures read as text and the map takes the full width.
            The in-SVG leader lines need gutters about as wide as the map itself,
            which on a phone leaves the map too small to read anything from. */}
        <div className="md:hidden flex flex-col gap-4 h-full justify-center min-h-0">
          <BeltReadout index={active} />
          <svg
            viewBox="-2 -4 104 112"
            className="w-full flex-1 min-h-0"
            role="img"
            aria-label={label}
          >
            <g fill="var(--text-muted)" opacity={0.18}>
              {REST_POINTS.map((p, i) => (
                <circle key={i} cx={p[0]} cy={p[1]} r={0.55} />
              ))}
            </g>
            {VIEW.map((b, i) => (
              <BeltLayer key={b.id} index={i} progress={scrollYProgress} />
            ))}
          </svg>
          <BeltTicks index={active} />
        </div>

        <div className="hidden md:block w-full max-w-6xl mx-auto">
          <svg
            viewBox="-46 -8 192 122"
            className="w-full h-auto max-h-[70vh] mx-auto"
            role="img"
            aria-label={label}
          >
            {/* Resting silhouette — the districts no belt claims. */}
            <g fill="var(--text-muted)" opacity={0.18}>
              {REST_POINTS.map((p, i) => (
                <circle key={i} cx={p[0]} cy={p[1]} r={0.5} />
              ))}
            </g>
            {VIEW.map((b, i) => (
              <BeltLayer key={b.id} index={i} progress={scrollYProgress} />
            ))}
            {VIEW.map((b, i) => (
              <BeltCallout key={`c-${b.id}`} index={i} progress={scrollYProgress} />
            ))}
          </svg>

          <div className="mt-4 flex flex-col gap-2">
            <BeltTicks index={active} />
            <p className="text-center font-mono text-[0.68rem] text-text-muted">
              {TOTAL_DISTRICTS} districts · plotted from real centroids
            </p>
          </div>
        </div>

        {/* The callouts fade in and out of the a11y tree as you scroll; this
            carries the same facts and never moves. */}
        <div className="sr-only">
          <h3>One system, every hazard belt</h3>
          <BeltList />
        </div>
      </div>
    </div>
  );
}
