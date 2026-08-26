/**
 * Shared motion values. Entrance animations were previously scattered across
 * fourteen `transition` blocks, only one of which named an easing curve — the
 * rest fell through to the library default, so nothing eased alike.
 */

/**
 * Exponential-ish ease-out: moves fast immediately, settles gently. The right
 * curve for something arriving on screen, because the motion is over before the
 * eye tracks it and only the settle is perceived.
 */
export const EASE_OUT = [0.17, 0.84, 0.44, 1] as const;

/** Entrance for a section heading or a lone block. */
export const enter = {
  initial: { opacity: 0, y: 14 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-10%" },
  transition: { duration: 0.6, ease: EASE_OUT },
} as const;

/** Entrance for one card in a staggered group; `i` is its index. */
export function enterStaggered(i: number) {
  return {
    initial: { opacity: 0, y: 18 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-10%" },
    transition: { duration: 0.6, delay: i * 0.08, ease: EASE_OUT },
  } as const;
}
