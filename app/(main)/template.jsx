"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Route-level page transition for the authenticated app shell.
 *
 * Next.js renders a fresh `template` instance on every navigation (unlike
 * layouts, which persist), so a simple enter animation here gives every
 * in-app page a calm fade + rise on arrival — no AnimatePresence/exit
 * bookkeeping, which keeps routing and loading states untouched.
 *
 * Reduced motion: collapses to an instant render.
 */
const EASE = [0.22, 1, 0.36, 1];

export default function MainTemplate({ children }) {
  const reduced = useReducedMotion();
  if (reduced) return <>{children}</>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}