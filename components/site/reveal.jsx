"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1];

/**
 * Reveal — blur-in + rise entrance, triggered when scrolled into view.
 * Use for sections/blocks. Pairs with `RevealStagger` + `RevealItem` for
 * staggered grids. Falls back to a plain div with no motion when the user
 * prefers reduced motion.
 *
 * @param {{ children: React.ReactNode, className?: string, delay?: number, y?: number, once?: boolean }}
 */
export function Reveal({ children, className, delay = 0, y = 16, once = true, ...props }) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      initial={{ opacity: 0, y, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once, amount: 0.25 }}
      transition={{ duration: 0.6, delay, ease: EASE }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * RevealStagger — orchestrates a staggered reveal for its RevealItem children.
 * Set `stagger` (seconds between items) and an optional `delay` before the
 * first item. Children must be <RevealItem />.
 */
export function RevealStagger({ children, className, stagger = 0.08, delay = 0, once = true, ...props }) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount: 0.2 }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * RevealItem — a single staggered item. Must be a descendant of RevealStagger.
 */
export function RevealItem({ children, className, y = 18, ...props }) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y, filter: "blur(8px)" },
        show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.6, ease: EASE } },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export default Reveal;