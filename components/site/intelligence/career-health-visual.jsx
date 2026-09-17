/**
 * CareerHealthVisual — restrained progress ring for the Career Health Score card.
 *
 * PRESENTATION ONLY: the 87/100 value is a static sample used to illustrate the
 * score surface on the landing page (mirroring hero-dashboard's sample metric).
 * It does NOT read from the database or represent any user's actual score —
 * hence the "example score" caption.
 */
const RADIUS = 44;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SAMPLE_SCORE = 87;

export function CareerHealthVisual() {
  const dashOffset = CIRCUMFERENCE * (1 - SAMPLE_SCORE / 100);

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center gap-1 p-2">
      <div className="relative">
        <svg viewBox="0 0 120 120" className="h-[84px] w-[84px] -rotate-90 md:h-28 md:w-28" aria-hidden="true">
          <defs>
            <linearGradient id="intelligence-chs" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="hsl(var(--accent))" />
              <stop offset="100%" stopColor="hsl(var(--primary))" />
            </linearGradient>
          </defs>
          {/* Track */}
          <circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            stroke="hsl(0 0% 100% / 0.08)"
            strokeWidth="7"
          />
          {/* Progress arc — slightly stronger on hover */}
          <circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            stroke="url(#intelligence-chs)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            className="transition-all duration-500 ease-spring group-hover:drop-shadow-[0_0_5px_hsl(var(--accent)/0.35)]"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display text-2xl font-bold tabular-nums text-white">
            {SAMPLE_SCORE}
            <span className="text-xs font-medium text-white/40">/100</span>
          </span>
        </div>
      </div>

      <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
        Excellent
      </span>
      <span className="text-[9px] tracking-wide text-white/30">example score</span>
    </div>
  );
}

export default CareerHealthVisual;