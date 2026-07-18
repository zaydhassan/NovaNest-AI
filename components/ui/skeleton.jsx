import { cn } from "@/lib/utils";

/**
 * Skeleton — animated placeholder. Uses the `shimmer` utility so it reads as
 * one system with the rest of the Aurora UI.
 */
function Skeleton({ className, ...props }) {
  return <div className={cn("shimmer rounded-md", className)} aria-hidden="true" {...props} />;
}

export { Skeleton };