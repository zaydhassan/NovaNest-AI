import { Briefcase, Target, PenLine, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * MemoryVisual — layered "memory chips" for the Memory-aware generation
 * card, stacked vertically to fit the fixed-width visual column.
 * Purely illustrative marketing markup. On hover the chips drift gently
 * apart while staying inside the shared stage geometry.
 */
const PANELS = [
  {
    label: "Your experience",
    icon: Briefcase,
    offset: "-rotate-1 translate-x-0.5",
    drift: "group-hover:-translate-y-1",
    tone: "text-primary",
  },
  {
    label: "Your goals",
    icon: Target,
    offset: "rotate-1 -translate-x-0.5",
    drift: "group-hover:translate-x-1.5",
    tone: "text-accent",
  },
  {
    label: "Your style",
    icon: PenLine,
    offset: "-rotate-[0.5deg]",
    drift: "group-hover:translate-y-1",
    tone: "text-white/70",
  },
];

export function MemoryVisual() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-2">
      {PANELS.map((panel) => {
        const Icon = panel.icon;
        return (
          <div
            key={panel.label}
            className={cn(
              "flex w-full items-center gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.04] px-2 py-1.5 shadow-[0_12px_32px_-16px_rgba(0,0,0,0.9)] transition-transform duration-500 ease-spring",
              panel.offset,
              panel.drift
            )}
          >
            <Icon className={cn("h-3 w-3 shrink-0", panel.tone)} />
            <span className="truncate text-[10px] font-medium text-white/80">
              {panel.label}
            </span>
          </div>
        );
      })}

      {/* Recall node — the moment memory is pulled back in */}
      <div className="mt-1 grid h-5 w-5 place-items-center rounded-full border border-accent/30 bg-accent/10 text-accent shadow-[0_0_18px_-4px_hsl(var(--accent)/0.6)]">
        <Sparkles className="h-2.5 w-2.5" />
      </div>
    </div>
  );
}

export default MemoryVisual;