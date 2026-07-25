"use client";

import React, { useRef } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Magnetic — wraps a child (usually a Button or icon button) and pulls it
 * toward the cursor on hover with soft spring physics, then settles back on
 * leave. No-ops to a plain wrapper when the user prefers reduced motion.
 *
 * @param {{ children: React.ReactNode, strength?: number, className?: string }}
 */
export function Magnetic({ children, strength = 0.35, className, ...props }) {
  const reduced = useReducedMotion();
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 250, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 250, damping: 18, mass: 0.4 });

  const onMouseMove = (e) => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const relX = e.clientX - (rect.left + rect.width / 2);
    const relY = e.clientY - (rect.top + rect.height / 2);
    x.set(relX * strength);
    y.set(relY * strength);
  };

  const onMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  if (reduced) {
    return <div className={cn("inline-flex", className)} {...props}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ x: sx, y: sy }}
      className={cn("inline-flex", className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export default Magnetic;