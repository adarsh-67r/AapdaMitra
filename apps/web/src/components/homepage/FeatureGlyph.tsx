"use client";

import { motion, useMotionValue, useTransform, type MotionValue } from "framer-motion";

export type GlyphKind = "report" | "heatmap" | "dispatch" | "fallback";

/**
 * A small diagram on each capability card that performs the capability.
 *
 * The point is explanation, not decoration: a pin locking onto a position, a
 * density map filling in, a line snapping to the nearest of several candidates.
 * A generic fade tells a reader nothing about what the product does, and this
 * page has four claims to make in four boxes.
 *
 * The planned capability is deliberately still. Every built one moves; the one
 * that does not exist yet sits inert at low contrast, so the difference is
 * visible before the LIVE / PLANNED label is read.
 *
 * Driven by the section's scroll progress — the same MotionValue that reveals
 * the card — rather than by a viewport trigger. Those are two different clocks:
 * a `whileInView` glyph inside a scroll-revealed card runs on its own schedule
 * and finishes while the card is still fading in, so the diagram is already over
 * by the time anything is visible. One driver, one timeline.
 *
 * `progress` omitted means no motion at all: the reduced-motion path and the
 * static fallback both render the finished diagram, because the explanation has
 * to survive even when the animation does not.
 */
export default function FeatureGlyph({
  kind,
  progress,
  start = 0,
}: {
  kind: GlyphKind;
  progress?: MotionValue<number>;
  start?: number;
}) {
  return (
    <svg
      viewBox="0 0 72 34"
      className="w-[72px] h-[34px] mb-3 shrink-0 overflow-visible"
      fill="none"
      aria-hidden
    >
      {kind === "report" && <ReportGlyph progress={progress} start={start} />}
      {kind === "heatmap" && <HeatmapGlyph progress={progress} start={start} />}
      {kind === "dispatch" && <DispatchGlyph progress={progress} start={start} />}
      {kind === "fallback" && <FallbackGlyph />}
    </svg>
  );
}

interface Driven {
  progress?: MotionValue<number>;
  start: number;
}

/**
 * The card has fully arrived by start + 0.12, so every diagram runs after that —
 * there is no point performing something behind a card still on its way in.
 * Kept in step with ARRIVED in FeatureHighlights.
 */
const AFTER_CARD = 0.12;

/** A position being acquired: the pin drops, the fix ripples out once. */
function ReportGlyph({ progress, start }: Driven) {
  const s = start + AFTER_CARD;
  const zero = useMotionZero();
  const p = progress ?? zero;
  const still = !progress;

  const pinY = useTransform(p, [s, s + 0.06], [-9, 0]);
  const pinOpacity = useTransform(p, [s, s + 0.04], [0, 1]);
  const rippleScale = useTransform(p, [s + 0.05, s + 0.16], [0.3, 2.2]);
  const rippleOpacity = useTransform(p, [s + 0.05, s + 0.09, s + 0.16], [0, 0.7, 0]);

  return (
    <g stroke="var(--accent)" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
      {/* Viewfinder corners — the frame the fix lands inside. */}
      <path d="M4 10V5h5M63 5h5v5M68 24v5h-5M9 29H4v-5" opacity={0.45} />
      {!still && (
        <motion.circle
          cx={36}
          cy={24}
          r={5}
          strokeWidth={1}
          style={{
            opacity: rippleOpacity,
            scale: rippleScale,
            transformBox: "fill-box",
            transformOrigin: "center",
          }}
        />
      )}
      <motion.g style={still ? undefined : { y: pinY, opacity: pinOpacity }}>
        <path d="M36 20s5-4.2 5-7.4a5 5 0 0 0-10 0c0 3.2 5 7.4 5 7.4Z" />
        <circle cx={36} cy={12.6} r={1.7} fill="var(--accent)" stroke="none" />
      </motion.g>
      <ellipse cx={36} cy={24} rx={4} ry={1.4} opacity={0.4} />
    </g>
  );
}

// Fixed values, so the "heat" reads as data rather than noise.
const CELLS = [
  0.15, 0.3, 0.55, 0.35, 0.2, 0.12, 0.25, 0.6, 0.95, 0.7, 0.3, 0.15,
  0.18, 0.45, 0.85, 0.6, 0.28, 0.14, 0.12, 0.22, 0.4, 0.3, 0.18, 0.1,
];

/** Density filling in: cells warm to their value in a diagonal sweep. */
function HeatmapGlyph({ progress, start }: Driven) {
  return (
    <g>
      {CELLS.map((v, i) => (
        <HeatCell key={i} index={i} value={v} progress={progress} start={start} />
      ))}
    </g>
  );
}

function HeatCell({
  index,
  value,
  progress,
  start,
}: Driven & { index: number; value: number }) {
  const col = index % 6;
  const row = Math.floor(index / 6);
  // A diagonal sweep, so it fills like a map redrawing rather than every cell
  // lighting at once.
  const s = start + AFTER_CARD + (col + row) * 0.006;
  const zero = useMotionZero();
  const opacity = useTransform(progress ?? zero, [s, s + 0.06], [0.06, value]);

  return (
    <motion.rect
      x={4 + col * 11}
      y={3 + row * 7.5}
      width={9.5}
      height={6}
      fill="var(--accent)"
      style={progress ? { opacity } : { opacity: value }}
    />
  );
}

const INCIDENT = { x: 12, y: 17 };
const UNITS = [
  { x: 30, y: 7, nearest: true },
  { x: 52, y: 24, nearest: false },
  { x: 63, y: 9, nearest: false },
];

/** The allocator: three candidates, and the line commits to the closest. */
function DispatchGlyph({ progress, start }: Driven) {
  const s = start + AFTER_CARD;
  const zero = useMotionZero();
  const p = progress ?? zero;
  const still = !progress;

  const draw = useTransform(p, [s, s + 0.08], [0, 1]);
  const landed = useTransform(p, [s + 0.08, s + 0.11], [0, 1]);

  return (
    <g>
      {UNITS.map((u, i) => (
        <circle
          key={i}
          cx={u.x}
          cy={u.y}
          r={2.6}
          fill="none"
          stroke="var(--text-muted)"
          strokeWidth={1.2}
          opacity={u.nearest ? 1 : 0.4}
        />
      ))}
      <motion.path
        d={`M ${INCIDENT.x} ${INCIDENT.y} L ${UNITS[0].x} ${UNITS[0].y}`}
        stroke="var(--accent)"
        strokeWidth={1.4}
        strokeLinecap="round"
        style={still ? undefined : { pathLength: draw }}
      />
      <motion.circle
        cx={UNITS[0].x}
        cy={UNITS[0].y}
        r={2.6}
        fill="var(--accent)"
        style={still ? undefined : { opacity: landed }}
      />
      <circle cx={INCIDENT.x} cy={INCIDENT.y} r={3.4} fill="var(--critical)" />
    </g>
  );
}

/**
 * Not built, so it does not move — and it is drawn broken: the transmission arcs
 * stop short of the tower. The card says PLANNED; this says the same thing
 * before anyone reads it.
 */
function FallbackGlyph() {
  return (
    <g stroke="var(--text-muted)" strokeWidth={1.4} strokeLinecap="round" fill="none" opacity={0.45}>
      <path d="M36 24V13" />
      <path d="M31 27h10" />
      <path d="M30 10a8 8 0 0 1 3-3" strokeDasharray="2 3" />
      <path d="M42 10a8 8 0 0 0-3-3" strokeDasharray="2 3" />
      <path d="M25 7a15 15 0 0 1 4-4" strokeDasharray="2 4" opacity={0.6} />
      <path d="M47 7a15 15 0 0 0-4-4" strokeDasharray="2 4" opacity={0.6} />
      <circle cx={36} cy={11} r={1.6} fill="var(--text-muted)" stroke="none" />
    </g>
  );
}

/**
 * A constant driver for the static path. `useTransform` is a hook and cannot be
 * called conditionally, so the no-motion case still needs a MotionValue to read
 * from — its output is simply never applied.
 */
function useMotionZero(): MotionValue<number> {
  return useMotionValue(0);
}
