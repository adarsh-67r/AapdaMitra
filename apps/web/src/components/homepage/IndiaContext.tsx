"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import CountUp from "./CountUp";
import { enter } from "@/lib/motion";

const HAZARDS = [
  { label: "Flood-prone landmass", value: 12, note: "~45M hectares (NDMA estimate)" },
  { label: "Earthquake-prone landmass (Zones III–V)", value: 59, note: "BMTPC seismic zoning" },
  { label: "Cyclone-prone coastline", value: 76, note: "~5,700 of 7,500 km" },
  { label: "Drought-vulnerable cultivable land", value: 68, note: "in varying degrees (NDMA)" },
];

const HOTSPOTS = [
  { region: "Himalayan Belt", risk: "Seismic" },
  { region: "Gangetic Plains", risk: "Flood" },
  { region: "East Coast", risk: "Cyclone" },
  { region: "Deccan Plateau", risk: "Drought" },
  { region: "Western Ghats", risk: "Landslide" },
];

function Bar({ label, value, note, index }: { label: string; value: number; note: string; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  return (
    <div ref={ref}>
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="text-sm font-medium">{label}</span>
        <span className="font-mono text-sm font-bold text-accent">
          <CountUp value={`${value}%`} />
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-accent"
          initial={{ width: 0 }}
          animate={inView ? { width: `${value}%` } : { width: 0 }}
          transition={{ duration: 1, delay: index * 0.12, ease: [0.17, 0.84, 0.44, 1] }}
        />
      </div>
      <span className="text-xs text-text-muted mt-1 block">{note}</span>
    </div>
  );
}

export default function IndiaContext() {
  return (
    <div className="relative z-10 px-6 md:px-10 py-14">
      <motion.p {...enter} className="font-mono text-xs tracking-widest text-accent mb-2">
        BUILT FOR INDIA'S HAZARD MAP
      </motion.p>
      <motion.h3 {...enter} className="text-3xl md:text-4xl font-bold tracking-[-0.02em] text-balance mb-10 max-w-[24ch]">
        No single hazard, no single region — a coordination layer has to cover the whole country
      </motion.h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 p-6 flex flex-col gap-6">
          {HAZARDS.map((h, i) => (
            <Bar key={h.label} label={h.label} value={h.value} note={h.note} index={i} />
          ))}
        </div>

        <div className="flex flex-col gap-3.5 justify-center">
          <p className="text-sm text-text-muted leading-relaxed mb-1">
            Five hazard belts, five different response patterns — a report from a Himalayan landslide and a
            report from a coastal cyclone land on the same map, routed by the same allocator.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {HOTSPOTS.map((h, i) => (
              <motion.div
                key={h.region}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="relative rounded-xl bg-white/[0.04] backdrop-blur-md border border-white/10 p-3.5"
              >
                <span className="relative flex h-2 w-2 mb-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-high opacity-60 animate-ping" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-high" />
                </span>
                <div className="text-sm font-semibold leading-tight">{h.region}</div>
                <div className="font-mono text-[0.68rem] text-text-muted uppercase tracking-wide mt-0.5">
                  {h.risk}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
