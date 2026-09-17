import { cn } from "@/lib/utils";

/**
 * TimelineVisual — auto-derived career timeline for Card 04: glowing
 * nodes on a thin vertical rail, oldest to newest, ending on a bright
 * "got an interview" node. Events fade slightly with age.
 */
const EVENTS = [
  { label: "Applied to 3 jobs", kind: "start" },
  { label: "Completed mock interview" },
  { label: "Updated resume" },
  { label: "Learned new skill" },
  { label: "Got an interview", kind: "final" },
];

export function TimelineVisual() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      {/* Centered column so the rail reads as a timeline, not a full-width list */}
      <div className="relative flex w-full max-w-[230px] flex-col justify-center gap-2 py-1 pl-4 pr-2">
      {/* Thin vertical rail, violet flowing into pink */}
      <span
        aria-hidden="true"
        className="absolute bottom-2 left-[19px] top-2 w-px bg-gradient-to-b from-primary/50 via-white/15 to-accent/60"
      />
      {EVENTS.map((e) => (
        <div key={e.label} className="flex items-center gap-2">
          <span
            className={cn(
              "h-1.5 w-1.5 shrink-0 rounded-full",
              e.kind === "final" &&
                "bg-accent shadow-[0_0_10px_2px_hsl(var(--accent)/0.45)]",
              e.kind === "start" && "bg-primary",
              !e.kind && "bg-white/35"
            )}
          />
          <span
            className={cn(
              "truncate text-[9px] leading-tight transition-colors duration-500",
              e.kind === "final"
                ? "font-medium text-white/85 group-hover:text-accent"
                : "text-white/60"
            )}
          >
            {e.label}
          </span>
        </div>
      ))}
      </div>
    </div>
  );
}

export default TimelineVisual;