import { Briefcase, Cpu, Target, Route } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * MemoryVisual — stacked translucent memory cards for Card 01. Each chip
 * is a durable memory layer; they sit slightly layered and drift apart
 * gently on hover. Purely illustrative marketing markup.
 */
const CHIPS = [
  {
    label: "Your roles",
    icon: Briefcase,
    tone: "text-primary",
    offset: "-rotate-[0.6deg] translate-x-0.5",
    drift: "group-hover:-translate-y-[3px] group-hover:translate-x-0",
  },
  {
    label: "Your skills",
    icon: Cpu,
    tone: "text-accent",
    offset: "rotate-[0.4deg]",
    drift: "group-hover:translate-y-[3px]",
  },
  {
    label: "Your goals",
    icon: Target,
    tone: "text-primary",
    offset: "-rotate-[0.3deg] -translate-x-0.5",
    drift: "group-hover:-translate-y-[3px]",
  },
  {
    label: "Your journey",
    icon: Route,
    tone: "text-accent",
    offset: "rotate-[0.6deg] translate-x-0.5",
    drift: "group-hover:translate-y-[3px]",
  },
];

export function MemoryVisual() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-3">
      {CHIPS.map((chip, i) => {
        const Icon = chip.icon;
        return (
          <div
            key={chip.label}
            className={cn(
              "z-[1] flex w-[88%] max-w-[200px] items-center gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.05] px-2 py-1.5 shadow-[0_10px_26px_-14px_rgba(0,0,0,0.9)] backdrop-blur-sm transition-transform duration-500 ease-spring",
              chip.offset,
              chip.drift,
              i > 0 && "-mt-1.5"
            )}
            style={{ opacity: 1 - i * 0.08 }}
          >
            <Icon className={cn("h-3 w-3 shrink-0", chip.tone)} />
            <span className="truncate text-[10px] font-medium text-white/80">
              {chip.label}
            </span>
            <span className="ml-auto h-1 w-1 shrink-0 rounded-full bg-white/25" />
          </div>
        );
      })}
    </div>
  );
}

export default MemoryVisual;