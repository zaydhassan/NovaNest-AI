"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

/**
 * Progress — animated gradient bar with a travelling shimmer and a soft glow
 * at the leading edge. API unchanged (value 0-100). The shimmer overlay is
 * clipped to the indicator so it only travels across the filled portion.
 */
const Progress = React.forwardRef(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-2 w-full overflow-hidden rounded-full bg-white/[0.08]",
      className
    )}
    {...props}>
    <ProgressPrimitive.Indicator
      className="relative h-full w-full flex-1 cta-gradient transition-transform duration-700 ease-spring"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    >
      {/* Travelling sheen across the filled portion. */}
      <span
        aria-hidden="true"
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent"
        style={{ animation: "shimmer 2.4s ease-in-out infinite" }}
      />
    </ProgressPrimitive.Indicator>
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }