import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Input — premium focus state.
 *
 * Smooth border-color transition into focus, a soft brand glow shadow on
 * focus, and a slightly lifted placeholder. Structure is unchanged so
 * react-hook-form registrations keep working.
 */
const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    (<input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-[border-color,box-shadow,background-color] duration-200 ease-spring file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/70 hover:border-foreground/25 focus-visible:outline-none focus-visible:border-primary/70 focus-visible:bg-primary/[0.03] focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:shadow-[0_0_0_4px_hsl(var(--primary)/0.10),0_8px_30px_-12px_hsl(var(--primary)/0.35)] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      ref={ref}
      {...props} />)
  );
})
Input.displayName = "Input"

export { Input }