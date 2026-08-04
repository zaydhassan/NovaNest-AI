"use client";

import React, { useEffect, useRef, useState } from "react";
import { useReducedMotion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";

export function AnimatedCounter({
  value,
  duration = 1200,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
}) {
  const reduced = useReducedMotion();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const [display, setDisplay] = useState(reduced ? value : 0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!inView || reduced) {
      setDisplay(value);
      return;
    }
    let start = null;
    const from = 0;
    const diff = value - from;

    function step(t) {
      if (!start) start = t;
      const elapsed = t - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + diff * eased);
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
      else setDisplay(value);
    }
    rafRef.current = requestAnimationFrame(step);
    return () => rafRef.current && cancelAnimationFrame(rafRef.current);
  }, [inView, value, duration, reduced]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {prefix}
      {display.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}

export default AnimatedCounter;