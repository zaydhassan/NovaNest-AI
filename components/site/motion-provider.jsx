"use client";

import { MotionConfig } from "framer-motion";

/**
 * MotionProvider — wraps the app in framer-motion's MotionConfig so every
 * motion.* animation honors the user's OS-level reduced-motion preference.
 *
 * Isolated into its own client component because framer-motion cannot be
 * imported directly from a server component (its `export *` is incompatible
 * with Next's client-boundary transform). The root layout is a server
 * component, so it composes this client island instead.
 */
export function MotionProvider({ children }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

export default MotionProvider;