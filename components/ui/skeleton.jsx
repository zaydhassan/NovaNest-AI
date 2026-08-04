import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }) {
  return <div className={cn("shimmer rounded-md", className)} aria-hidden="true" {...props} />;
}

export { Skeleton };