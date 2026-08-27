"use client";

import { motion, useReducedMotion } from "framer-motion";
import { EASE_OUT } from "@/lib/motion";

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
 * visible before the LIVE / PLANNED label is read. Motion is doing the same job
 * as the label, which is the only reason it earns four separate animations on
 * one screen.
 *
 * Plays once on arrival rather than looping — four looping diagrams beside body
 * copy is noise, and there is nothing here worth watching twice.
 */
export default function FeatureGlyph({ kind, delay = 0 }: { kind: GlyphKind; delay?: number }) {
  const reduce = useReducedMotion();

  return (
    <svg
      viewBox="0 0 72 34"
      className="w-[72px] h-[34px] mb-3 shrink-0 overflow-visible"
      fill="none"
      aria-hidden
    >
      {kind === "report" && <ReportGlyph delay={delay} still={!!reduce} />}
      {kind === "heatmap" && <HeatmapGlyph delay={delay} still={!!reduce} />}
      {kind === "dispatch" && <DispatchGlyph delay={delay} still={!!reduce} />}
      {kind === "fallback" && <FallbackGlyph />}
    </svg>
  );
}

// Deeper than the -10% the shared entrance tokens use. The cards themselves are
// revealed by scroll progress, not by a viewport trigger, so these are two
// different clocks: firing on the same margin risks a glyph finishing its run
// while its card is still transparent, and the reader arriving to a diagram that
// has already happened.
const view = { once: true, margin: "-25%" } as const;

/** A position being acquired: the pin drops, the fix ripples out once. */
function ReportGlyph({ delay, still }: { delay: number; still: boolean }) {
  return (
    <g stroke="var(--accent)" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
      {/* Viewfinder corners — the frame the fix lands inside. */}
      <path d="M4 10V5h5M63 5h5v5M68 24v5h-5M9 29H4v-5" opacity={0.45} />
      <motion.g
        initial={still ? undefined : { opacity: 0, transform: "translateY(-9px)" }}
        whileInView={still ? undefined : { opacity: 1, transform: "translateY(0px)" }}
        viewport={view}
        transition={{ duration: 0.45, delay: delay + 0.1, ease: EASE_OUT }}
      >
        <path d="M36 20s5-4.2 5-7.4a5 5 0 0 0-10 0c0 3.2 5 7.4 5 7.4Z" />
        <circle cx={36} cy={12.6} r={1.7} fill="var(--accent)" stroke="none" />
      </motion.g>
      {!still && (
        <motion.circle
          cx={36}
          cy={24}
          r={5}
          initial={{ opacity: 0, transform: "scale(0.3)" }}
          whileInView={{ opacity: [0, 0.7, 0], transform: "scale(2.2)" }}
          viewport={view}
          transition={{ duration: 0.9, delay: delay + 0.45, ease: EASE_OUT }}
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
          strokeWidth={1}
        />
      )}
      <ellipse cx={36} cy={24} rx={4} ry={1.4} opacity={0.4} />
    </g>
  );
}

/** Density filling in: cells warm to their value in a wave, as a poll would. */
function HeatmapGlyph({ delay, still }: { delay: number; still: boolean }) {
  // Fixed values, so the "heat" reads as data rather than noise.
  const cells = [
    0.15, 0.3, 0.55, 0.35, 0.2, 0.12, 0.25, 0.6, 0.95, 0.7, 0.3, 0.15,
    0.18, 0.45, 0.85, 0.6, 0.28, 0.14, 0.12, 0.22, 0.4, 0.3, 0.18, 0.1,
  ];
  return (
    <g>
      {cells.map((v, i) => {
        const col = i % 6;
        const row = Math.floor(i / 6);
        return (
          <motion.rect
            key={i}
            x={4 + col * 11}
            y={3 + row * 7.5}
            width={9.5}
            height={6}
            fill="var(--accent)"
            initial={still ? undefined : { opacity: 0.06 }}
            whileInView={still ? undefined : { opacity: v }}
            viewport={view}
            transition={{
              duration: 0.5,
              // A diagonal sweep, so it fills like a map redrawing rather than
              // every cell lighting at once.
              delay: delay + 0.15 + (col + row) * 0.045,
              ease: EASE_OUT,
            }}
            style={still ? { opacity: v } : undefined}
          />
        );
      })}
    </g>
  );
}

/** The allocator: three candidates, and the line commits to the closest. */
function DispatchGlyph({ delay, still }: { delay: number; still: boolean }) {
  const incident = { x: 12, y: 17 };
  const units = [
    { x: 30, y: 7, near: true },
    { x: 52, y: 24 },
    { x: 63, y: 9 },
  ];
  return (
    <g>
      {units.map((u, i) => (
        <circle
          key={i}
          cx={u.x}
          cy={u.y}
          r={2.6}
          fill="none"
          stroke="var(--text-muted)"
          strokeWidth={1.2}
          opacity={u.near ? 1 : 0.4}
        />
      ))}
      <motion.path
        d={`M ${incident.x} ${incident.y} L ${units[0].x} ${units[0].y}`}
        stroke="var(--accent)"
        strokeWidth={1.4}
        strokeLinecap="round"
        initial={still ? undefined : { pathLength: 0 }}
        whileInView={still ? undefined : { pathLength: 1 }}
        viewport={view}
        transition={{ duration: 0.45, delay: delay + 0.25, ease: EASE_OUT }}
      />
      <motion.circle
        cx={units[0].x}
        cy={units[0].y}
        r={2.6}
        fill="var(--accent)"
        initial={still ? undefined : { opacity: 0 }}
        whileInView={still ? undefined : { opacity: 1 }}
        viewport={view}
        transition={{ duration: 0.2, delay: delay + 0.7, ease: EASE_OUT }}
      />
      <circle cx={incident.x} cy={incident.y} r={3.4} fill="var(--critical)" />
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
    <g
      stroke="var(--text-muted)"
      strokeWidth={1.4}
      strokeLinecap="round"
      fill="none"
      opacity={0.45}
    >
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
