"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Toast = { id: number; text: string; kind: "ok" | "error" };

/** Fire a toast from anywhere: toast("Saved"), toast("Failed", "error"). */
export function toast(text: string, kind: "ok" | "error" = "ok") {
  window.dispatchEvent(new CustomEvent("bm:toast", { detail: { text, kind } }));
}

export function Toaster() {
  const [items, setItems] = useState<Toast[]>([]);

  useEffect(() => {
    let n = 0;
    const onToast = (e: Event) => {
      const { text, kind } = (e as CustomEvent).detail;
      const id = ++n;
      setItems((t) => [...t.slice(-2), { id, text, kind }]);
      setTimeout(() => setItems((t) => t.filter((x) => x.id !== id)), 2600);
    };
    window.addEventListener("bm:toast", onToast);
    return () => window.removeEventListener("bm:toast", onToast);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[70] flex flex-col items-center gap-2 px-6">
      <AnimatePresence>
        {items.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 14, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className={`glass px-5 py-2.5 text-[13.5px] font-semibold ${
              t.kind === "error" ? "text-rose-500" : "text-ink-100"
            }`}
          >
            {t.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
