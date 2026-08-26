"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangleIcon, CheckIcon } from "@/components/icons";

type ToastTone = "success" | "error";
type Toast = { id: number; tone: ToastTone; message: string };

const ToastContext = createContext<((tone: ToastTone, message: string) => void) | null>(null);

/**
 * Replaces `window.alert()` for report submission feedback. The native dialog
 * blocked the main thread, couldn't be styled, and looked like browser chrome
 * at the one moment the product most needs to feel considered — a citizen who
 * has just reported an emergency.
 *
 * Enters and exits along the same edge, so the motion reads as one object
 * arriving and leaving rather than two separate effects.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((tone: ToastTone, message: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, tone, message }]);
    // Errors need longer to read than a confirmation.
    const ttl = tone === "error" ? 6000 : 4000;
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), ttl);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="fixed bottom-0 inset-x-0 z-50 flex flex-col items-center gap-2 p-4 pointer-events-none">
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, transform: "translateY(100%)" }}
              animate={{ opacity: 1, transform: "translateY(0%)" }}
              exit={{ opacity: 0, transform: "translateY(100%)" }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              onClick={() => setToasts((list) => list.filter((x) => x.id !== t.id))}
              className="pointer-events-auto max-w-md w-full flex items-start gap-2.5 px-4 py-3 rounded-xl bg-panel border shadow-[0_16px_40px_-16px_rgba(0,0,0,0.7)] cursor-pointer"
              style={{ borderColor: t.tone === "error" ? "var(--critical)" : "var(--available)" }}
            >
              <span
                className="shrink-0 mt-0.5"
                style={{ color: t.tone === "error" ? "var(--critical)" : "var(--available)" }}
              >
                {t.tone === "error" ? <AlertTriangleIcon size={16} /> : <CheckIcon size={16} />}
              </span>
              <span className="text-sm leading-snug">{t.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const show = useContext(ToastContext);
  if (!show) throw new Error("useToast must be used inside <ToastProvider>");
  return show;
}
