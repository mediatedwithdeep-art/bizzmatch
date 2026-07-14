"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

/** One-shot canvas confetti burst (violet/cyan/magenta/emerald), ~2s. */
export function Confetti() {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width: W, height: H } = canvas.getBoundingClientRect();
    canvas.width = W * 2;
    canvas.height = H * 2;
    ctx.scale(2, 2);

    const colors = ["#b39dff", "#8b5cf6", "#22d3ee", "#f472b6", "#34d399"];
    const parts = Array.from({ length: 90 }, () => ({
      x: W / 2 + (Math.random() - 0.5) * 90,
      y: H * 0.42,
      vx: (Math.random() - 0.5) * 11,
      vy: -(4 + Math.random() * 9),
      s: 3.5 + Math.random() * 4.5,
      r: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      c: colors[(Math.random() * colors.length) | 0],
    }));

    let frame = 0;
    let raf = 0;
    const tick = () => {
      ctx.clearRect(0, 0, W, H);
      for (const p of parts) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.32;
        p.r += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.fillStyle = p.c;
        ctx.globalAlpha = Math.max(0, 1 - frame / 110);
        ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.62);
        ctx.restore();
      }
      if (++frame < 120) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  return <canvas ref={ref} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden />;
}
