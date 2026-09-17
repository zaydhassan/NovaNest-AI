import { MessagesSquare, Network, Code2, ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * QuestionsVisual — stacked question-type chips for the Role-specific
 * questions card, sized for the fixed-width visual column.
 * On hover the deck fans out slightly.
 */
const CHIPS = [
  {
    label: "Behavioral",
    icon: MessagesSquare,
    offset: "translate-x-1 rotate-[1.5deg]",
    fan: "group-hover:-translate-y-1 group-hover:rotate-[2.5deg]",
    tone: "text-primary",
  },
  {
    label: "System Design",
    icon: Network,
    offset: "-translate-x-0.5",
    fan: "group-hover:translate-x-1.5",
    tone: "text-accent",
  },
  {
    label: "Technical",
    icon: Code2,
    offset: "translate-x-1.5 -rotate-[1deg]",
    fan: "group-hover:translate-y-1 group-hover:-rotate-[2deg]",
    tone: "text-white/70",
  },
];

export function QuestionsVisual() {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center gap-1.5 p-2.5">
      {CHIPS.map((chip) => {
        const Icon = chip.icon;
        return (
          <div
            key={chip.label}
            className={cn(
              "flex w-full items-center justify-between gap-1 rounded-lg border border-white/[0.07] bg-white/[0.045] px-1.5 py-1.5 shadow-[0_12px_32px_-16px_rgba(0,0,0,0.9)] transition-transform duration-500 ease-spring",
              chip.offset,
              chip.fan
            )}
          >
            <span className="flex min-w-0 items-center gap-1">
              <Icon className={cn("h-3 w-3 shrink-0", chip.tone)} />
              <span className="truncate text-[10px] font-medium text-white/80">
                {chip.label}
              </span>
            </span>
            <ChevronRight className="h-2.5 w-2.5 shrink-0 text-white/30" />
          </div>
        );
      })}

      {/* Fresh-generation marker */}
      <div className="absolute right-2 top-2 grid h-4 w-4 place-items-center rounded-full border border-primary/30 bg-primary/10 text-primary">
        <Sparkles className="h-2 w-2" />
      </div>
    </div>
  );
}

export default QuestionsVisual;