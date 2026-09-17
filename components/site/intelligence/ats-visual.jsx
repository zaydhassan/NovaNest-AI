import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * AtsVisual — mini resume + keyword match meter for the Instant ATS tuning
 * card, stacked vertically to fit the fixed-width visual column. Lines with
 * a pink tint represent matched keywords; they brighten on hover.
 * All values are illustrative product imagery.
 */
const LINES = [
  { width: "w-[85%]", accent: false },
  { width: "w-[92%]", accent: true },
  { width: "w-[70%]", accent: false },
  { width: "w-[88%]", accent: true },
  { width: "w-[55%]", accent: false },
  { width: "w-[45%]", accent: true },
];

export function AtsVisual() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2.5 p-2.5">
      {/* Mini resume */}
      <div className="w-full rounded-lg border border-white/[0.07] bg-white/[0.03] p-2 shadow-[0_12px_32px_-16px_rgba(0,0,0,0.9)]">
        <div className="mb-1.5 h-1.5 w-2/5 rounded-full bg-white/25" />
        <div className="space-y-1">
          {LINES.map((line, i) => (
            <div
              key={i}
              className={cn(
                "h-1 rounded-full",
                line.width,
                line.accent
                  ? "bg-accent/30 transition-colors duration-500 ease-spring group-hover:bg-accent/50"
                  : "bg-white/10"
              )}
            />
          ))}
        </div>
      </div>

      {/* Match meter */}
      <div className="w-full">
        <div className="mb-1 flex items-baseline justify-between">
          <span className="text-[8px] font-medium uppercase tracking-wider text-white/40">
            Keyword match
          </span>
          <span className="text-[9px] font-semibold tabular-nums text-white/70">
            92%
          </span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.08]">
          <div className="h-full w-[92%] rounded-full bg-gradient-to-r from-accent/80 to-primary/80 transition-all duration-500 ease-spring group-hover:from-accent group-hover:to-primary" />
        </div>
      </div>

      {/* Status chip */}
      <span className="inline-flex w-fit items-center gap-1 rounded-full border border-accent/25 bg-accent/10 px-1.5 py-0.5 text-[9px] font-medium text-accent">
        <CheckCircle2 className="h-2.5 w-2.5" />
        ATS optimized
      </span>
    </div>
  );
}

export default AtsVisual;