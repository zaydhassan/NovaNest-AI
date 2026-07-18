import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Separator — lightweight divider (no radix dependency). Oriented via `orientation`.
 */
const Separator = React.forwardRef(function Separator(
  { className, orientation = "horizontal", decorative = true, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      role={decorative ? "none" : "separator"}
      aria-orientation={decorative ? undefined : orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className
      )}
      {...props}
    />
  );
});

export { Separator };