"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * StatCounter — animated count-up KPI tile. Extracted from the inline
 * StatCard that previously lived in app/page.js. Respects reduced-motion by
 * jumping straight to the target value.
 *
 * @param {{ icon: React.ReactNode, from?: number, to: number, suffix?: string, label: string, delay?: number, accent?: string }}
 */
export function StatCounter({ icon, from = 0, to = 100, suffix = "", label = "", delay = 0, accent }) {
  const [value, setValue] = useState(from);
  const [reduced, setReduced] = useState(false);
  const rafRef = useRef(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
  }, []);

  useEffect(() => {
    if (reduced) {
      setValue(to);
      return;
    }
    let start = null;
    const duration = 1100 + delay;
    const diff = to - from;

    function step(t) {
      if (!start) start = t;
      const elapsed = t - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(from + diff * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setValue(to);
      }
    }

    rafRef.current = requestAnimationFrame(step);
    return () => rafRef.current && cancelAnimationFrame(rafRef.current);
  }, [from, to, delay, reduced]);

  return (
    <motion.div
      className="glass rounded-xl p-6 flex flex-col items-start gap-4"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay: delay / 1000 }}
      whileHover={{ scale: 1.02 }}
      tabIndex={0}
      aria-label={`${to}${suffix} ${label}`}
    >
      <div className="flex items-center gap-3">
        <div
          className="grid h-11 w-11 place-items-center rounded-xl text-white"
          style={{ background: accent }}
        >
          {icon}
        </div>
        <div>
          <div className="text-3xl font-extrabold leading-none md:text-4xl">
            {value}
            <span className="ml-1 text-lg">{suffix}</span>
          </div>
          <div className="text-sm text-muted-foreground">{label}</div>
        </div>
      </div>
    </motion.div>
  );
}

export default StatCounter;