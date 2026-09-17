import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SpotlightCard } from "@/components/site/spotlight-card";
import { cn } from "@/lib/utils";

/**
 * WhyCard — feature card for the "Why NovaNest" section.
 *
 * Vertical geometry, identical in every card:
 *
 *   icon + index row (full width)
 *   copy block (full width, flex-1): title → description → arrow (mt-auto)
 *   visual stage (full width, fixed h-32) pinned to the card bottom
 *
 * Full-width copy keeps titles/descriptions to 2–3 lines instead of
 * wrapping down a skinny column, and the fixed-height stage plus
 * auto-rows-fr on the grid align all six cards row-for-row: arrows sit
 * at the same height, stages at the same height.
 *
 * Hover (calm by design): card lifts 3px, border brightens, the visual
 * stage brightens from slightly dimmed to full, the arrow drifts right,
 * and a whisper of accent glow appears in the top-right corner.
 */
export function WhyCard({
  index,
  icon: Icon,
  title,
  description,
  visual: Visual,
  href = "/dashboard",
  tone = "accent",
  className,
}) {
  const num = String(index).padStart(2, "0");
  const isPrimary = tone === "primary";

  return (
    <SpotlightCard
      as="article"
      className={cn(
        "card-hover group relative flex h-full flex-col overflow-hidden rounded-[20px] border border-border bg-card p-6 transition-all duration-500 ease-spring hover:-translate-y-[3px] hover:border-white/[0.16]",
        className
      )}
    >
      {/* Depth + hover accent glow — subtle, corner-anchored */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[radial-gradient(140%_120%_at_50%_0%,hsl(var(--foreground)/0.03),transparent_45%)]"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-14 -top-14 h-36 w-36 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `radial-gradient(circle, hsl(var(--${
            isPrimary ? "primary" : "accent"
          }) / 0.10), transparent 70%)`,
        }}
      />

      {/* Icon + index */}
      <div className="relative mb-4 flex items-center justify-between">
        <div
          className={cn(
            "grid h-10 w-10 place-items-center rounded-[11px] border border-white/[0.08] bg-white/[0.03] shadow-[inset_0_1px_0_hsl(0_0%_100%/0.05)] transition-colors duration-300 ease-spring",
            isPrimary
              ? "text-primary group-hover:border-primary/30 group-hover:bg-primary/[0.07]"
              : "text-accent group-hover:border-accent/30 group-hover:bg-accent/[0.07]"
          )}
        >
          <Icon className="h-[18px] w-[18px]" />
        </div>
        <span className="font-mono text-[10px] font-semibold leading-none tracking-[0.3em] text-muted-foreground/60">
          {num}
        </span>
      </div>

      {/* Copy — full width so long descriptions stay on few lines.
          The arrow rides mt-auto, absorbing description-length variance
          so it sits at the same height in every card of a row. */}
      <h3 className="relative text-[17px] font-semibold tracking-tight text-foreground">
        {title}
      </h3>
      <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      <Link
        href={href}
        aria-label={`See ${title} in the workspace`}
        className="relative mt-auto inline-flex w-max items-center pt-5"
      >
        <span className="grid h-8 w-8 place-items-center rounded-full border border-border text-muted-foreground transition-all duration-300 ease-spring group-hover:border-accent/40 group-hover:text-accent">
          <ArrowRight className="h-4 w-4 transition-transform duration-300 ease-spring group-hover:translate-x-1" />
        </span>
      </Link>

      {/* Visual — miniature product scene on a shared dark stage.
          Fixed height at every breakpoint so cards never stretch to
          match a tall visual; dimmed at rest, full on hover. */}
      <div className="relative mt-5 h-32 w-full shrink-0 overflow-hidden rounded-xl border border-white/[0.06] bg-[#0A0B10] opacity-90 transition-opacity duration-500 group-hover:opacity-100">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_0%,hsl(0_0%_100%/0.03),transparent_50%)]"
        />
        {Visual ? <Visual /> : null}
      </div>
    </SpotlightCard>
  );
}

export default WhyCard;