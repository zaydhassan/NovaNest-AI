import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Textarea — mirrors the Input's premium focus treatment.
 */
const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    (<textarea
      className={cn(
        "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-[border-color,box-shadow,background-color] duration-200 ease-spring placeholder:text-muted-foreground/70 hover:border-foreground/25 focus-visible:outline-none focus-visible:border-primary/70 focus-visible:bg-primary/[0.03] focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:shadow-[0_0_0_4px_hsl(var(--primary)/0.10),0_8px_30px_-12px_hsl(var(--primary)/0.35)] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      ref={ref}
      {...props} />)
  );
})
Textarea.displayName = "Textarea"

export { Textarea }