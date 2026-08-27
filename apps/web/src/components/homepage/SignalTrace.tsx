"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";

/**
 * A route threaded between the page's sections.
 *
 * Each section is a node; one path connects them, drawing itself as you scroll
 * and lighting each node as it arrives there. It runs down the outer margins,
 * switching sides between sections — a straight line pinned to one edge reads as
 * a progress bar, a piece of browser chrome, while a route that changes sides
 * reads as something travelling. It stays out of the middle because the page has
 * no reserved gutter and the middle is where the words are.
 *
 * Purely decorative: aria-hidden, behind the content, and static for a reader
 * who asked for reduced motion.
 */

/** The sections the route visits, in document order. */
const STOPS = ["problem", "hazard-map", "how-it-works", "features", "capabilities"];

/**
 * Where each node sits across the width, as a fraction.
 *
 * These stay in the outer margins on alternating sides. The page has no reserved
 * gutter — sections run nearly full width — so a route that wanders through the
 * middle crosses body copy, which reads as scribble over the text rather than as
 * anything travelling. Hugging the edges keeps it clear of the words while still
 * moving side to side down the page.
 */
const ACROSS = [0.055, 0.945, 0.055, 0.945, 0.055];

interface Node {
  id: string;
  /** Fraction of page width. */
  fx: number;
  /** Fraction of page height. */
  fy: number;
  /** How far along the route this node sits, 0–1. */
  at: number;
}

export default function SignalTrace() {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [d, setD] = useState("");

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  // The head lags the scroll slightly, so the route reads as something
  // travelling rather than something pinned to the scrollbar.
  const head = useSpring(scrollYProgress, { stiffness: 90, damping: 26, restDelta: 0.0005 });

  useEffect(() => {
    const measure = () => {
      const host = ref.current;
      if (!host) return;
      const w = host.offsetWidth;
      const h = host.offsetHeight;
      if (w <= 0 || h <= 0) return;

      const top = host.offsetTop;
      const vh = window.innerHeight;

      const found = STOPS.map((id, i) => {
        const el = document.getElementById(id);
        if (!el) return null;
        // Anchor where the section first sits centred in the viewport, NOT at
        // its own centre. The pinned sections are 240–440vh tall, so their
        // centres are two viewports deep inside a scroll region — a node there
        // marks empty space the reader never sees anything at.
        const y = el.offsetTop - top + Math.min(el.offsetHeight, vh) / 2;
        return { id, x: ACROSS[i % ACROSS.length] * w, y: Math.min(Math.max(y, 0), h) };
      }).filter((n): n is { id: string; x: number; y: number } => n !== null);

      if (found.length < 2) return;

      // Distances are computed in real pixels — the route's timing has to follow
      // the shape as drawn, not as normalised.
      const spans: number[] = [0];
      for (let i = 1; i < found.length; i++) {
        spans.push(spans[i - 1] + Math.hypot(found[i].x - found[i - 1].x, found[i].y - found[i - 1].y));
      }
      const total = spans[spans.length - 1] || 1;

      setNodes(found.map((n, i) => ({ id: n.id, fx: n.x / w, fy: n.y / h, at: spans[i] / total })));
      setD(routeThrough(found, w, h));
    };

    measure();
    const observer = new ResizeObserver(measure);
    if (ref.current) observer.observe(ref.current);
    window.addEventListener("resize", measure);
    // Fonts and images settle after first paint and move everything down.
    const settle = window.setTimeout(measure, 600);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
      window.clearTimeout(settle);
    };
  }, []);

  if (!d) return <div ref={ref} className="absolute inset-0" aria-hidden />;

  return (
    // Below lg there is no margin to spare, so the route is not drawn at all
    // rather than laid over the content.
    <div
      ref={ref}
      className="absolute inset-0 z-0 pointer-events-none overflow-hidden hidden lg:block"
      aria-hidden
    >
      {/* The path lives in a 0–100 box stretched over the page. Only the line is
          drawn here, and `non-scaling-stroke` keeps its weight even, so the
          extreme aspect ratio of a very tall page cannot deform anything. The
          nodes are DOM elements below, which can never be stretched into
          ellipses the way an SVG circle in this box would be. */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        fill="none"
      >
        <path
          d={d}
          stroke="var(--border)"
          strokeWidth={1}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        {reduceMotion ? (
          <path
            d={d}
            stroke="var(--accent)"
            strokeWidth={1}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            opacity={0.5}
          />
        ) : (
          <motion.path
            d={d}
            stroke="var(--accent)"
            strokeWidth={1}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            opacity={0.5}
            style={{ pathLength: head }}
          />
        )}
      </svg>

      {nodes.map((n) => (
        <Stop key={n.id} node={n} head={head} still={!!reduceMotion} />
      ))}
    </div>
  );
}

/**
 * A cubic through the stops, leaving and entering each one vertically so the
 * route bows between columns instead of cutting straight diagonals.
 *
 * Control points are computed in pixels and converted, because a "bow" of a
 * fixed fraction in a 0–100 box means something wildly different horizontally
 * than vertically on a page ten times taller than it is wide.
 */
function routeThrough(pts: { x: number; y: number }[], w: number, h: number): string {
  const X = (v: number) => ((v / w) * 100).toFixed(3);
  const Y = (v: number) => ((v / h) * 100).toFixed(3);

  let d = `M ${X(pts[0].x)} ${Y(pts[0].y)}`;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    // A deep bow holds the line against each margin for most of the run and
    // makes the crossing quick, so it spends as little height as possible over
    // the middle of the page where the text is.
    const bow = (b.y - a.y) * 0.46;
    d += ` C ${X(a.x)} ${Y(a.y + bow)}, ${X(b.x)} ${Y(b.y - bow)}, ${X(b.x)} ${Y(b.y)}`;
  }
  return d;
}

/** A section's node. A DOM element, so it is always round. */
function Stop({ node, head, still }: { node: Node; head: ReturnType<typeof useSpring>; still: boolean }) {
  // Lights as the head passes and stays lit, so the route reads as a journey
  // already made rather than a row of blinking dots.
  const lit = useTransform(head, [node.at - 0.02, node.at + 0.01], [0, 1]);
  const flare = useTransform(head, [node.at - 0.02, node.at, node.at + 0.06], [0, 1, 0]);
  const flareScale = useTransform(flare, [0, 1], [0.4, 2.4]);

  const place = {
    left: `${(node.fx * 100).toFixed(3)}%`,
    top: `${(node.fy * 100).toFixed(3)}%`,
  };

  if (still) {
    return (
      <span className="absolute -translate-x-1/2 -translate-y-1/2" style={place}>
        <span className="block w-2 h-2 rounded-full bg-accent opacity-60" />
      </span>
    );
  }

  return (
    <span className="absolute -translate-x-1/2 -translate-y-1/2" style={place}>
      <motion.span
        className="block w-2 h-2 rounded-full bg-accent"
        style={{ opacity: lit }}
      />
      <motion.span
        className="absolute inset-0 -m-2 rounded-full border border-accent"
        style={{ opacity: flare, scale: flareScale }}
      />
    </span>
  );
}
