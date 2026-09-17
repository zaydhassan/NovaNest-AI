import { Reveal, RevealStagger, RevealItem } from "@/components/site/reveal";
import { aiFeatures } from "@/data/aiFeatures";
import { IntelligenceCard } from "./intelligence-card";
import { MemoryVisual } from "./memory-visual";
import { VoiceVisual } from "./voice-visual";
import { CareerHealthVisual } from "./career-health-visual";
import { QuestionsVisual } from "./questions-visual";
import { AtsVisual } from "./ats-visual";
import { PrivacyVisual } from "./privacy-visual";

/**
 * IntelligenceSection — premium 3×2 showcase of the NovaNest intelligence
 * layer. Marketing presentation only; visuals are static illustrative
 * markup and never read from the database or user state.
 */

const VISUALS = [
  MemoryVisual,
  VoiceVisual,
  CareerHealthVisual,
  QuestionsVisual,
  AtsVisual,
  PrivacyVisual,
];

/**
 * Thin curved "career trajectory" lines + tiny nodes connecting the section
 * header to the grid. Decorative only — masked so it fades before the edges
 * and stays well behind the cards.
 */
function TrajectoryLines() {
  return (
    <svg
      className="absolute inset-0 h-full w-full [mask-image:radial-gradient(ellipse_75%_75%_at_50%_35%,#000_35%,transparent_95%)]"
      viewBox="0 0 1200 700"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <g fill="none" strokeWidth="1">
        <path d="M600 30 C 600 190, 180 230, 150 460" stroke="hsl(var(--foreground) / 0.10)" />
        <path d="M600 30 C 600 210, 1020 240, 1050 460" stroke="hsl(var(--foreground) / 0.10)" />
        <path d="M600 30 C 600 300, 600 340, 600 470" stroke="hsl(var(--foreground) / 0.08)" strokeDasharray="3 6" />
        {/* Subtle orbit arc, top right */}
        <path d="M930 84 C 1000 54, 1090 84, 1120 154" stroke="hsl(var(--accent) / 0.18)" strokeDasharray="2 7" />
      </g>
      <g>
        <circle cx="600" cy="30" r="3" fill="hsl(var(--accent) / 0.55)" />
        <circle cx="150" cy="460" r="3" fill="hsl(var(--accent) / 0.45)" />
        <circle cx="1050" cy="460" r="3" fill="hsl(var(--primary) / 0.45)" />
        <circle cx="600" cy="470" r="2.5" fill="hsl(var(--foreground) / 0.25)" />
        {/* Small activity markers along the trajectories */}
        <rect x="356" y="146" width="4" height="4" rx="0.8" fill="hsl(var(--accent) / 0.35)" transform="rotate(45 358 148)" />
        <rect x="862" y="152" width="4" height="4" rx="0.8" fill="hsl(var(--primary) / 0.35)" transform="rotate(45 864 154)" />
        <rect x="594" y="248" width="4" height="4" rx="0.8" fill="hsl(var(--foreground) / 0.20)" transform="rotate(45 596 250)" />
      </g>
    </svg>
  );
}

export function IntelligenceSection() {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      {/* Atmospheric background — near-black base, faint radial accent
          lighting, a whisper of grid, and trajectory lines. Sits entirely
          behind the content and fades toward the edges. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 55% 40% at 50% 0%, hsl(var(--accent) / 0.06), transparent 65%), radial-gradient(ellipse 45% 40% at 88% 55%, hsl(var(--primary) / 0.05), transparent 60%)",
          }}
        />
        <div className="absolute inset-0 grid-mesh opacity-40" />
        <TrajectoryLines />
      </div>

      <div className="container mx-auto px-4">
        {/* Header — eyebrow, then heading, then description */}
        <div className="mx-auto mb-14 max-w-3xl text-center md:mb-16">
          <Reveal y={12}>
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Intelligence layer
            </span>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl lg:text-5xl">
              Intelligence woven into{" "}
              <span className="text-accent">every step</span>
            </h2>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
              The OS layer that turns your activity into memory, scores, and
              guidance — contextual, private, and built for the work you
              actually do.
            </p>
          </Reveal>
        </div>

        {/* Strict 3 × 2 grid — every row is exactly the same height
            (grid-auto-rows: minmax(0, 1fr)), identical column and row gaps,
            cards never positioned individually. */}
        <RevealStagger
          className="mx-auto grid max-w-6xl auto-rows-fr grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3"
          stagger={0.08}
          delay={0.1}
        >
          {aiFeatures.map((feature, i) => (
            <RevealItem key={feature.title}>
              <IntelligenceCard
                index={i + 1}
                title={feature.title}
                description={feature.description}
                visual={VISUALS[i]}
              />
            </RevealItem>
          ))}
        </RevealStagger>
      </div>
    </section>
  );
}

export default IntelligenceSection;