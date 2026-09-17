import { Sparkles } from "lucide-react";

/**
 * AgentVisual — the intent router for Card 02: one central NovaNest AI
 * node dispatching to five specialist agents along subtle curved lines.
 * Reads as ONE OS → MULTIPLE SPECIALISTS. Lines brighten and the
 * satellites lift slightly on hover.
 */
const NODES = [
  { label: "Resume", x: 22, y: 17 },
  { label: "Interview", x: 78, y: 14 },
  { label: "Apply", x: 19, y: 74 },
  { label: "Learning", x: 81, y: 72 },
  { label: "Analytics", x: 50, y: 93 },
];

export function AgentVisual() {
  return (
    <div className="relative h-full w-full">
      {/* Curved dispatch lines — center to each specialist */}
      <svg
        className="absolute inset-0 h-full w-full opacity-70 transition-opacity duration-500 group-hover:opacity-100"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <g fill="none" strokeWidth="1">
          {NODES.map((n, i) => (
            <path
              key={n.label}
              d={`M50 48 Q ${(50 + n.x) / 2} ${(48 + n.y) / 2 - (i % 2 ? 10 : -6)}, ${n.x} ${n.y}`}
              stroke={i % 2 ? "hsl(var(--primary) / 0.30)" : "hsl(var(--accent) / 0.26)"}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>
      </svg>

      {/* Central NovaNest AI node */}
      <div className="absolute left-1/2 top-[48%] z-[1] -translate-x-1/2 -translate-y-1/2">
        <div className="grid h-8 w-8 place-items-center rounded-full border border-accent/30 bg-accent/10 text-accent shadow-[0_0_20px_-6px_hsl(var(--accent)/0.7)] transition-transform duration-500 ease-spring group-hover:scale-110">
          <Sparkles className="h-3.5 w-3.5" />
        </div>
        <span className="mt-1 block whitespace-nowrap text-center text-[8px] font-medium tracking-wide text-white/55">
          NovaNest AI
        </span>
      </div>

      {/* Specialist chips */}
      {NODES.map((n, i) => (
        <div
          key={n.label}
          className="absolute z-[1] -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-md border border-white/[0.08] bg-[#101219] px-1.5 py-0.5 text-[9px] font-medium text-white/70 shadow-[0_6px_16px_-8px_rgba(0,0,0,0.8)] transition-transform duration-500 ease-spring group-hover:translate-y-[calc(-50%_-_2px)]"
          style={{ left: `${n.x}%`, top: `${n.y}%`, transitionDelay: `${i * 40}ms` }}
        >
          <span
            className="mr-1 inline-block h-1 w-1 rounded-full align-middle"
            style={{
              background: i % 2 ? "hsl(var(--primary) / 0.8)" : "hsl(var(--accent) / 0.8)",
            }}
          />
          {n.label}
        </div>
      ))}
    </div>
  );
}

export default AgentVisual;