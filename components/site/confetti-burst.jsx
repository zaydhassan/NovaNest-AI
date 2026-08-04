"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

const COLORS = ["hsl(var(--cyan))", "hsl(var(--purple))", "hsl(var(--emerald))", "hsl(var(--primary))"];

export function ConfettiBurst({ originX = "50%", originY = "30%", count = 18 }) {
  const reduced = useReducedMotion();
  if (reduced) return null;

  const pieces = Array.from({ length: count });
  const angleFor = (i) => (Math.PI * 2 * i) / count + (i % 2 ? 0.3 : -0.2);
  const distFor = (i) => 80 + (i % 5) * 28;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-visible" aria-hidden="true">
      {pieces.map((_, i) => {
        const ang = angleFor(i);
        const dist = distFor(i);
        const x = Math.cos(ang) * dist;
        const y = Math.sin(ang) * dist - 40;
        const color = COLORS[i % COLORS.length];
        return (
          <motion.span
            key={i}
            className="absolute h-2 w-2 rounded-[2px]"
            style={{ left: originX, top: originY, background: color }}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
            animate={{
              x: [0, x, x * 1.2],
              y: [0, y, y + 120],
              opacity: [1, 1, 0],
              rotate: [0, i % 2 ? 180 : -180, i % 2 ? 360 : -360],
              scale: [1, 1, 0.6],
            }}
            transition={{ duration: 1.4, delay: 0.1 + (i % 6) * 0.03, ease: [0.22, 1, 0.36, 1] }}
          />
        );
      })}
    </div>
  );
}

export default ConfettiBurst;