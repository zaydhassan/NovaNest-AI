import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SpotlightCard } from "@/components/site/spotlight-card";
import { cn } from "@/lib/utils";

/**
 * IntelligenceCard — split feature card for the Intelligence Layer section.
 *
 * Internal layout is a strict CSS grid so every card in the grid shares
 * identical geometry:
 *
 *   | text column (minmax(0,1fr)) | visual column (fixed 128px) |
 *
 * Text column flow (flex column, no absolute positioning):
 *   number → title (fixed min-height, keeps descriptions aligned)
 *   → description → flexible spacer → arrow (margin-top: auto)
 *
 * Hover behavior (calm, no aggressive glow):
 * - card lifts 4px and border becomes slightly more visible (via .card-hover)
 * - accent lighting strengthens (via SpotlightCard's mouse-follow glow/ring)
 * - the arrow drifts up-right
 * - each visual animates subtly via its own `group-hover:` transitions
 */
export function IntelligenceCard({
  index,
  title,
  description,
  visual: Visual,
  href = "/dashboard",
  className,
}) {
  const num = String(index).padStart(2, "0");

  return (
    <SpotlightCard
      className={cn(
        "card-hover group relative flex h-full flex-col overflow-hidden rounded-[20px] border border-border bg-card p-5 md:p-6",
        className
      )}
    >
      {/* Extremely subtle inner gradient — depth without glassmorphism */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[radial-gradient(140%_120%_at_50%_0%,hsl(var(--foreground)/0.03),transparent_45%)]"
      />

      {/* Split grid: text column + fixed-width visual column.
          Mobile stacks to a single column (visual below the text). */}
      <div className="relative grid h-full flex-1 grid-cols-1 gap-5 md:grid-cols-[minmax(0,1fr)_128px]">
        {/* LEFT — copy */}
        <div className="flex min-w-0 flex-col">
          <span className="mb-3 font-mono text-[11px] font-semibold leading-none tracking-[0.3em] text-muted-foreground/80 transition-colors duration-300 ease-spring group-hover:text-accent">
            {num}
          </span>
          {/* Fixed two-line title area so every description starts at
              the same vertical position, regardless of title wrapping */}
          <h3 className="min-h-[42px] text-lg font-semibold text-foreground">
            {title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
          {/* Spacer absorbs description-length variance; arrow always
              sits at the same bottom-left position */}
          <Link
            href={href}
            aria-label={`See ${title} in the workspace`}
            className="mt-auto pt-5"
          >
            <span className="grid h-8 w-8 place-items-center rounded-full border border-border text-muted-foreground transition-all duration-300 ease-spring group-hover:border-accent/40 group-hover:text-accent">
              <ArrowUpRight className="h-4 w-4 transition-transform duration-300 ease-spring group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </span>
          </Link>
        </div>

        {/* RIGHT — miniature product visual on a shared dark stage.
            Column width is fixed by the grid; the stage stretches to
            the full content height (aligned identically in every card). */}
        <div className="relative h-36 w-full shrink-0 overflow-hidden rounded-xl border border-white/[0.06] bg-[#0A0B10] md:h-auto md:self-stretch">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_0%,hsl(0_0%_100%/0.03),transparent_50%)]"
          />
          {Visual ? <Visual /> : null}
        </div>
      </div>
    </SpotlightCard>
  );
}

export default IntelligenceCard;