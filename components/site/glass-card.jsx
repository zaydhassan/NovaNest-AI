import { cn } from "@/lib/utils";

/**
 * GlassCard — the building block of the Aurora UI. A translucent, blurred
 * surface with a hairline border and optional hover lift/glow. Accepts an
 * optional `accent` gradient ring for emphasis.
 *
 * @param {{ as?: React.ElementType, strong?: boolean, className?: string, children: React.ReactNode }}
 */
export function GlassCard({ as: Comp = "div", strong = false, className, children, ...props }) {
  return (
    <Comp
      className={cn(
        strong ? "glass-strong" : "glass",
        "rounded-2xl shadow-glass transition-all duration-300 ease-spring hover:-translate-y-1 hover:shadow-glass-lg hover:border-white/20",
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}

export default GlassCard;