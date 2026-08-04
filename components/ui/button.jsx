import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/btn relative inline-flex select-none items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 ease-spring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      // Solid brand action — purple, lit-from-above, soft glow on hover.
      default:
        "bg-primary text-primary-foreground shadow-card hover:bg-primary-strong hover:shadow-glow before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-white/20",
      // The reserved accent gradient — CTAs only. Sheen sweep on hover.
      gradient:
        "cta-gradient text-white shadow-glow hover:shadow-glass-lg bg-[length:200%_100%] hover:bg-[position:100%_0] before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-white/25",
      destructive:
        "bg-destructive text-destructive-foreground shadow-card hover:bg-destructive/90 hover:shadow-[0_12px_40px_-12px_hsl(var(--destructive)/0.55)] before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-white/20",
      outline:
        "border border-input bg-background/60 backdrop-blur-sm hover:bg-muted hover:border-foreground/25 hover:text-accent-foreground text-foreground",
      secondary:
        "bg-secondary text-secondary-foreground shadow-card hover:bg-secondary/80 hover:border-white/10 before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-white/10",
      ghost: "hover:bg-muted text-foreground/90 hover:text-foreground",
      link: "text-primary underline-offset-4 hover:underline",
    },
    compoundVariants: [],
    // Sizes — previously missing, which made every `size="lg"` across the app
    // a no-op. Restored so CTAs actually feel substantial.
    size: {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-md px-3 text-xs",
      lg: "h-12 rounded-md px-7 text-base",
      xl: "h-14 rounded-lg px-8 text-base",
      icon: "h-10 w-10",
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

/**
 * Button — tactile, layered surface.
 *
 * - Adds a light "sheen" sweep on hover (a diagonal highlight that travels
 *   across the surface) for a physical, premium press feel. The sheen is a
 *   pseudo-element via an inner span so it never affects layout or leaks
 *   through `asChild`.
 * - Supports an optional `loading` prop that swaps the leading content for a
 *   spinner and disables interaction, without changing the button's width.
 */
const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    const isBusy = loading
    // The hover sheen is a sibling of the content. Radix Slot calls
    // React.Children.only on its children, so when asChild is true the
    // Slot must receive exactly one child — the sheen cannot be a sibling
    // (and a `{false}` placeholder still counts as a children-array entry,
    // which trips Children.only). Render the sheen only when !asChild, and
    // keep the asChild branch a single-element child.
    const content = isBusy ? (
      <>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>{children}</span>
      </>
    ) : (
      children
    )
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isBusy}
        aria-busy={isBusy || undefined}
        {...props}
      >
        {asChild ? (
          content
        ) : (
          <>
            {/* Hover sheen — pure decoration, kept off screen until hover. */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-spring group-hover/btn:translate-x-full"
            />
            {content}
          </>
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }