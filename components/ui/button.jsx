import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 ease-spring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      // Solid brand action — purple, with a soft glow on hover.
      default:
        "bg-primary text-primary-foreground shadow-sm hover:bg-primary-strong hover:shadow-glow",
      // The reserved accent gradient — CTAs only.
      gradient:
        "cta-gradient text-white shadow-glow hover:shadow-glass-lg bg-[length:200%_100%] hover:bg-[position:100%_0]",
      destructive:
        "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
      outline:
        "border border-input bg-background backdrop-blur-sm hover:bg-muted hover:text-accent-foreground text-foreground",
      secondary:
        "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      ghost: "hover:bg-muted text-foreground/90 hover:text-foreground",
      link: "text-primary underline-offset-4 hover:underline",
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    (<Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />)
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }