"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";

/**
 * A route threaded between the page's sections.
 *
 * Each section is a node; one path connects them, drawing itself as you scroll
 * and lighting each section as it arrives there.
 *
 * It wanders deliberately. A straight line down the margin reads as a progress
 * bar — a piece of browser chrome — where a path that crosses the page from one
 * section to the next reads as something travelling between them.
 *
 * Purely decorative: aria-hidden, behind the content, and not animated at all
 * for a reader who asked for reduced motion.
 */

/** The sections the route visits, in document order. */
const STOPS = ["problem", "hazard-map", "how-it-works", "features", "capabilities"];

/**
 * Where each section's node sits across the width, as a fraction. Hand-picked
 * rather than generated: the sequence has to wander without ever landing under
 * the reading column, and a random one re-rolled on every load cannot promise
 * that.
 */
const ACROSS = [0.16, 0.79, 0.31, 0.86, 0.22];

interface Node {
  id: string;
  x: number;
  y: number;
  /** How far along the route this node sits, 0–1. */
  at: number;
}

export default function SignalTrace() {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [nodes, setNodes] = useState<Node[]>([]);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  // The head lags the scroll slightly, so the route reads as something
  // travelling rather than something pinned to the scrollbar.
  const head = useSpring(scrollYProgress, { stiffness: 90, damping: 26, restDelta: 0.0005 });

  // Positions are measured from the DOM rather than hardcoded, so the route
  // stays correct as section heights change with content and viewport.
  useEffect(() => {
    const measure = () => {
      const host = ref.current;
      if (!host) return;
      const w = host.offsetWidth;
      const h = host.offsetHeight;
      if (w <= 0 || h <= 0) return;
      setBox({ w, h });

      const top = host.offsetTop;
      const found = STOPS.map((id, i) => {
        const el = document.getElementById(id);
        if (!el) return null;
        const centre = el.offsetTop + el.offsetHeight / 2 - top;
        return {
          id,
          x: ACROSS[i % ACROSS.length] * w,
          y: Math.min(Math.max(centre, 0), h),
        };
      }).filter((n): n is Omit<Node, "at"> => n !== null);

      // Each node's position along the route, by cumulative distance, so a
      // section lights when the drawn head actually reaches it rather than when
      // its vertical position says it should.
      const spans: number[] = [0];
      for (let i = 1; i < found.length; i++) {
        const dx = found[i].x - found[i - 1].x;
        const dy = found[i].y - found[i - 1].y;
        spans.push(spans[i - 1] + Math.hypot(dx, dy));
      }
      const total = spans[spans.length - 1] || 1;
      setNodes(found.map((n, i) => ({ ...n, at: spans[i] / total })));
    };

    measure();
    window.addEventListener("resize", measure);
    // Fonts and images settle after first paint and move everything down.
    const settle = window.setTimeout(measure, 600);
    return () => {
      window.removeEventListener("resize", measure);
      window.clearTimeout(settle);
    };
  }, []);

  const d = routeThrough(nodes);
  const ready = box.w > 0 && nodes.length > 1;

  return (
    <div ref={ref} className="absolute inset-0 z-0 pointer-events-none" aria-hidden>
      {ready && (
        {/* The viewBox is in real measured pixels, so `none` letterboxes nothing
            and distorts nothing: one user unit is one pixel. */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox={`0 0 ${box.w} ${box.h}`}
          preserveAspectRatio="none"
          style={{ opacity: 0.55 }}
        >
          {/* The route not yet travelled, faint. */}
          <path d={d} fill="none" stroke="var(--border)" strokeWidth={1.25} strokeLinecap="round" />

          {/* The route already travelled. */}
          {reduceMotion ? (
            <path d={d} fill="none" stroke="var(--accent)" strokeWidth={1.25} strokeLinecap="round" />
          ) : (
            <motion.path
              d={d}
              fill="none"
              stroke="var(--accent)"
              strokeWidth={1.25}
              strokeLinecap="round"
              style={{ pathLength: head }}
            />
          )}

          {nodes.map((n) => (
            <Stop key={n.id} node={n} head={head} still={!!reduceMotion} />
          ))}
        </svg>
      )}
    </div>
  );
}

/**
 * A cubic through the stops that leaves and enters each one vertically, so the
 * route bows between columns instead of cutting across in straight diagonals.
 */
function routeThrough(nodes: Node[]): string {
  if (nodes.length < 2) return "";
  let d = `M ${nodes[0].x} ${nodes[0].y}`;
  for (let i = 1; i < nodes.length; i++) {
    const a = nodes[i - 1];
    const b = nodes[i];
    const bow = (b.y - a.y) * 0.42;
    d += ` C ${a.x} ${a.y + bow}, ${b.x} ${b.y - bow}, ${b.x} ${b.y}`;
  }
  return d;
}

/** A section's node: a marker that lights as the route reaches it. */
function Stop({ node, head, still }: { node: Node; head: ReturnType<typeof useSpring>; still: boolean }) {
  // Lights as the head passes and stays lit, so the route reads as a journey
  // already made rather than a row of blinking dots.
  const lit = useTransform(head, [node.at - 0.02, node.at + 0.01], [0, 1]);
  const flare = useTransform(head, [node.at - 0.02, node.at, node.at + 0.06], [0, 1, 0]);
  const flareScale = useTransform(flare, [0, 1], [0.45, 2.1]);

  if (still) {
    return (
      <>
        <circle cx={node.x} cy={node.y} r={7} fill="none" stroke="var(--accent)" strokeWidth={1} />
        <circle cx={node.x} cy={node.y} r={3} fill="var(--accent)" />
      </>
    );
  }

  return (
    <>
      <motion.circle
        cx={node.x}
        cy={node.y}
        r={7}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={1}
        style={{ opacity: lit }}
      />
      <motion.circle cx={node.x} cy={node.y} r={3} fill="var(--accent)" style={{ opacity: lit }} />
      {/* The arrival: a ring that expands once as the route lands. */}
      <motion.circle
        cx={node.x}
        cy={node.y}
        r={8}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
        style={{
          opacity: flare,
          scale: flareScale,
          transformBox: "fill-box",
          transformOrigin: "center",
        }}
      />
    </>
  );
}
