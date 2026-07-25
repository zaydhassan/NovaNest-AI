import * as React from "react"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-all duration-200 ease-spring focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary/15 text-primary hover:bg-primary/25 hover:shadow-[0_8px_24px_-12px_hsl(var(--primary)/0.6)]",
        secondary:
          "border border-border bg-muted text-secondary-foreground hover:bg-muted/80 hover:border-white/10",
        destructive:
          "border-transparent bg-destructive/15 text-destructive hover:bg-destructive/25",
        outline: "border border-border bg-transparent text-foreground/80 hover:bg-muted hover:border-foreground/20",
        gradient:
          "border-transparent cta-gradient text-white shadow-glow hover:shadow-glass-lg",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  ...props
}) {
  return (<div className={cn(badgeVariants({ variant }), className)} {...props} />);
}

export { Badge, badgeVariants }