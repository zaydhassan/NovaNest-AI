import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    (<input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-muted/40 px-3 py-1 text-base shadow-sm transition-[border-color,box-shadow,background-color] duration-200 ease-spring file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/70 hover:border-foreground/25 hover:bg-muted/60 focus-visible:outline-none focus-visible:border-primary/70 focus-visible:bg-primary/[0.03] focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:shadow-[0_0_0_4px_hsl(var(--primary)/0.10),0_8px_30px_-12px_hsl(var(--primary)/0.35)] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      ref={ref}
      {...props} />)
  );
})
Input.displayName = "Input"

export { Input }