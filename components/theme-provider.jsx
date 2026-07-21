"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { MotionConfig } from "framer-motion";

/**
 * ThemeProvider — wraps the app in next-themes and Framer Motion's MotionConfig.
 * `reducedMotion: "user"` makes every motion component honour the OS
 * prefers-reduced-motion setting: transforms/layout animations are disabled and
 * opacity animations are shortened, so accessibility users get a calm UI without
 * touching each animation call site. (CSS keyframe animations — aurora, marquee,
 * floaty, shimmer — are already gated by the reduced-motion media query in
 * globals.css.)
 */
export function ThemeProvider({ children, ...props }) {
  return (
    <NextThemesProvider {...props}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </NextThemesProvider>
  );
}