"use client";

import { MotionConfig } from "framer-motion";
import { ToastProvider } from "@/components/Toast";

/**
 * Framer Motion does not honour the OS "reduce motion" setting on its own — it
 * has to be told. `reducedMotion="user"` makes every animation in the tree
 * respect it: transform and layout animations are skipped, opacity ones are
 * kept (they don't trigger vestibular symptoms), so content still appears
 * instead of vanishing.
 *
 * This covers the whole app from one place, including the looping background
 * blobs and the map's radar sweep, which are the animations most likely to
 * bother a motion-sensitive user.
 */
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <ToastProvider>{children}</ToastProvider>
    </MotionConfig>
  );
}
