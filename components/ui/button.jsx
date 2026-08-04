import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/btn relative inline-flex select-none items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 ease-spring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      default:
        "bg-primary text-primary-foreground shadow-card hover:bg-primary-strong hover:shadow-glow before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-white/20",
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

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    const isBusy = loading
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