import { Mic } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * VoiceVisual — mini interview interface for the Voice mock interviews card,
 * stacked vertically to fit the fixed-width visual column: mic, waveform,
 * live-feedback status. Static waveform at rest; on hover the bars re-settle
 * into a different amplitude pattern (calm, single transition — no
 * continuous animation).
 */
const BARS = [
  "scale-y-[0.25] group-hover:scale-y-[0.70] bg-white/15",
  "scale-y-[0.45] group-hover:scale-y-[0.35] bg-white/15 transition-delay-[60ms]",
  "scale-y-[0.65] group-hover:scale-y-[0.90] bg-accent/70 transition-delay-[120ms]",
  "scale-y-[0.35] group-hover:scale-y-[0.55] bg-white/15 transition-delay-[40ms]",
  "scale-y-[0.90] group-hover:scale-y-[0.60] bg-accent/70 transition-delay-[100ms]",
  "scale-y-[0.50] group-hover:scale-y-[0.95] bg-white/20 transition-delay-[20ms]",
  "scale-y-[0.75] group-hover:scale-y-[0.45] bg-accent/70 transition-delay-[80ms]",
  "scale-y-[0.30] group-hover:scale-y-[0.65] bg-white/15 transition-delay-[140ms]",
  "scale-y-[0.60] group-hover:scale-y-[0.40] bg-white/15",
  "scale-y-[0.95] group-hover:scale-y-[0.75] bg-accent/70 transition-delay-[60ms]",
  "scale-y-[0.40] group-hover:scale-y-[0.90] bg-white/15 transition-delay-[120ms]",
  "scale-y-[0.70] group-hover:scale-y-[0.50] bg-white/20 transition-delay-[40ms]",
  "scale-y-[0.30] group-hover:scale-y-[0.80] bg-accent/70 transition-delay-[100ms]",
  "scale-y-[0.55] group-hover:scale-y-[0.35] bg-white/15 transition-delay-[20ms]",
];

export function VoiceVisual() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-3">
      {/* Interviewer mic */}
      <div className="grid h-9 w-9 place-items-center rounded-xl border border-accent/25 bg-accent/10 text-accent shadow-[0_0_24px_-8px_hsl(var(--accent)/0.55)]">
        <Mic className="h-4 w-4" />
      </div>

      {/* Waveform */}
      <div className="flex h-8 items-center justify-center gap-[3px] overflow-hidden px-1">
        {BARS.map((bar, i) => (
          <span
            key={i}
            className={cn(
              "block h-8 w-[3px] shrink-0 rounded-full transition-transform duration-500 ease-spring",
              bar
            )}
          />
        ))}
      </div>

      {/* Live status */}
      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-2 py-0.5 text-[9px] font-medium text-white/70">
        <span className="h-1 w-1 animate-pulse rounded-full bg-accent" />
        Live feedback
      </span>
    </div>
  );
}

export default VoiceVisual;