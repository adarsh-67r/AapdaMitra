"use client";

import { motion } from "framer-motion";
import { enterStaggered } from "@/lib/motion";

const NUMBERS = [
  { label: "Fire", value: "101" },
  { label: "Police", value: "100" },
  { label: "Medical", value: "108" },
  { label: "Disaster (NDRF)", value: "1078" },
];

/**
 * The one part of this page that is useful during an actual emergency.
 *
 * They were plain text, which on a phone means reading a number off the screen
 * and typing it back in. They are `tel:` links now — that matters more than any
 * of the motion here.
 *
 * The numbers themselves deliberately do not animate. A digit roll or scramble
 * was the obvious flourish and is the wrong call: this is data someone may be
 * trying to read in a hurry, and making them wait for it to settle to save a
 * life is not a trade worth any amount of polish.
 */
export default function EmergencyNumbers() {
  return (
    <nav
      aria-label="Emergency numbers"
      className="relative z-10 px-6 md:px-10 py-6 border-y border-border"
    >
      <ul className="flex flex-wrap gap-x-3 gap-y-2 font-mono text-sm">
        {NUMBERS.map((n, i) => (
          <motion.li key={n.label} {...enterStaggered(i)}>
            <a
              href={`tel:${n.value}`}
              className="inline-flex items-baseline gap-2 px-3 py-2 -mx-1 border border-transparent
                         text-text-muted transition-[background-color,border-color,transform]
                         duration-150 ease-out hover:border-border active:scale-[0.97]"
            >
              <span className="text-text font-semibold">{n.label}</span>
              <span className="tabular-nums">{n.value}</span>
            </a>
          </motion.li>
        ))}
      </ul>
    </nav>
  );
}
