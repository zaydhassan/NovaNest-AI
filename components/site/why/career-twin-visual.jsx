import { cn } from "@/lib/utils";

/**
 * CareerTwinVisual — floating message bubbles for Card 03: the Twin
 * answering in the user's own voice. Text is intentionally tiny and
 * secondary; bubbles drift gently upward on hover, staggered.
 */
const BUBBLES = [
  {
    text: "Based on your experience…",
    side: "self-start",
    offset: "-rotate-[0.5deg]",
    drift: "group-hover:-translate-y-0.5",
    dot: "hsl(var(--accent) / 0.8)",
    delay: "0ms",
  },
  {
    text: "Here's how you might answer…",
    side: "self-end",
    offset: "rotate-[0.5deg]",
    drift: "group-hover:-translate-y-1",
    dot: "hsl(var(--primary) / 0.8)",
    delay: "60ms",
  },
  {
    text: "That aligns with your goals…",
    side: "self-start",
    offset: "translate-x-1",
    drift: "group-hover:-translate-y-[6px]",
    dot: "hsl(var(--accent) / 0.8)",
    delay: "120ms",
  },
];

export function CareerTwinVisual() {
  return (
    <div className="flex h-full w-full items-center justify-center p-2">
      {/* Centered column so the left/right bubble rhythm survives the wide stage */}
      <div className="flex w-full max-w-[250px] flex-col justify-center gap-1.5">
        {BUBBLES.map((b) => (
          <div
            key={b.text}
            className={cn(
              "flex w-max max-w-full items-start gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.04] px-2 py-1.5 shadow-[0_10px_26px_-14px_rgba(0,0,0,0.9)] transition-transform duration-500 ease-spring",
              b.side,
              b.offset,
              b.drift
            )}
            style={{ transitionDelay: b.delay }}
          >
            <span
              className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ background: b.dot }}
            />
            <span className="text-[9px] leading-tight text-white/70">{b.text}</span>
          </div>
        ))}

        <div className="mt-1 flex justify-center">
          <span className="whitespace-nowrap rounded-full border border-primary/25 bg-primary/[0.08] px-2 py-0.5 text-[8px] font-medium tracking-wide text-white/55 transition-colors duration-500 group-hover:border-primary/40 group-hover:text-white/75">
            Confident. Consistent. You.
          </span>
        </div>
      </div>
    </div>
  );
}

export default CareerTwinVisual;