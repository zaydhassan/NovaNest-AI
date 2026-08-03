import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Card — premium layered surface.
 *
 * Base treatment (composes with any className via twMerge):
 *  - hairline border in the token border color
 *  - a 1px top inset highlight so the surface catches light from above
 *  - `shadow-elevated` for soft depth
 *  - smooth, GPU-friendly transitions so callers can layer hover lifts
 *
 * Callers still own hover/lift behaviour (many pages add
 * `hover:-translate-y-1.5 hover:shadow-glow`), so we only provide the calm
 * resting state and the transition glue.
 */
const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative rounded-xl border border-border bg-card text-card-foreground shadow-card transition-[transform,box-shadow,border-color] duration-300 ease-spring",
      "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
      className
    )}
    {...props} />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props} />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight", className)}
    {...props} />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props} />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props} />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }