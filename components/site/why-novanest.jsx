"use client";

import Link from "next/link";
import { ArrowRight, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal, RevealStagger, RevealItem } from "@/components/site/reveal";
import { whyFeatures } from "@/data/whyFeatures";
import { WhyCard } from "./why/why-card";
import { ConnectiveLines } from "./why/connective-lines";
import { MemoryVisual } from "./why/memory-visual";
import { AgentVisual } from "./why/agent-visual";
import { CareerTwinVisual } from "./why/career-twin-visual";
import { TimelineVisual } from "./why/timeline-visual";
import { WorkspaceVisual } from "./why/workspace-visual";
import { PrivacyVisual } from "./why/privacy-visual";

/**
 * WhyNovaNest — the "one connected career OS" statement section.
 *
 * Marketing presentation only; all visuals are static illustrative
 * markup and never read from the database or user state. Six features
 * (data/whyFeatures.js) map 1:1 onto the six miniature product visuals
 * below, telling one story in order: memory → agents → twin →
 * timeline → workspace → privacy.
 */

const VISUALS = [
  MemoryVisual,
  AgentVisual,
  CareerTwinVisual,
  TimelineVisual,
  WorkspaceVisual,
  PrivacyVisual,
];

/** Very subtle editorial microcopy flanking the grid.
    Anchored to the section (not the container) so it sits in the outer
    viewport margins and never overlaps the max-w-6xl grid. Hidden below
    1440px, where those margins get too narrow. */
function SideMicrocopy() {
  return (
    <>
      <div
        aria-hidden="true"
        className="absolute left-4 top-[44%] hidden -translate-y-1/2 select-none min-[1440px]:block"
      >
        <p className="text-[9px] font-medium uppercase leading-[2.3] tracking-[0.22em] text-white/[0.22]">
          More
          <br />
          context.
          <br />
          Better
          <br />
          decisions.
          <br />
          A brighter
          <br />
          you.
        </p>
      </div>
      <div
        aria-hidden="true"
        className="absolute right-4 top-[46%] hidden -translate-y-1/2 select-none text-right min-[1440px]:block"
      >
        <p className="text-[9px] font-medium uppercase leading-[2.3] tracking-[0.22em] text-white/[0.22]">
          Your career.
          <br />
          All connected.
        </p>
      </div>
    </>
  );
}

/** Low-opacity curved horizon behind the bottom CTA — closes the section. */
function HorizonArc() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 800 220"
      preserveAspectRatio="none"
      className="pointer-events-none absolute -top-12 left-1/2 h-60 w-[160%] -translate-x-1/2 opacity-80 [mask-image:radial-gradient(ellipse_55%_100%_at_50%_100%,#000_35%,transparent_72%)]"
    >
      <defs>
        <linearGradient id="nn-horizon" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="hsl(var(--accent))" />
          <stop offset="1" stopColor="hsl(var(--primary))" />
        </linearGradient>
      </defs>
      <g fill="none">
        <path
          d="M0 200 C 260 120, 540 120, 800 200"
          stroke="url(#nn-horizon)"
          strokeOpacity="0.22"
          strokeWidth="1.5"
        />
        <path
          d="M60 212 C 300 142, 500 142, 740 212"
          stroke="hsl(var(--primary) / 0.15)"
          strokeWidth="1"
          strokeDasharray="2 8"
        />
      </g>
    </svg>
  );
}

export default function WhyNovaNest() {
  return (
    <section
      id="why-novanest"
      className="relative overflow-hidden px-4 py-24 md:py-32"
    >
      {/* Atmospheric background — near-black base, faint radial accent
          lighting (violet upper-left, magenta upper-right, violet floor),
          a whisper of grid. Entirely behind the content. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 42% 34% at 12% 5%, hsl(var(--primary) / 0.08), transparent 65%), radial-gradient(ellipse 38% 30% at 88% 7%, hsl(var(--accent) / 0.06), transparent 60%), radial-gradient(ellipse 55% 28% at 50% 102%, hsl(var(--primary) / 0.05), transparent 65%)",
        }}
      />
      <div aria-hidden="true" className="grid-mesh pointer-events-none absolute inset-0 opacity-40" />

      <SideMicrocopy />

      <div className="container relative mx-auto">
        {/* Header — eyebrow → headline → supporting copy */}
        <div className="relative mx-auto max-w-3xl text-center">
          <Reveal y={12}>
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground backdrop-blur">
              <Sparkles className="h-3 w-3 text-accent" />
              Why NovaNest
            </span>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 className="text-4xl font-extrabold leading-[1.08] tracking-tight text-foreground md:text-5xl lg:text-[3.5rem]">
              What makes it an{" "}
              <span className="block bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                operating system
              </span>
            </h2>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mx-auto mt-6 max-w-[760px] text-base leading-relaxed text-muted-foreground md:text-lg">
              NovaNest isn&apos;t a resume builder with a chatbot bolted on.
              It&apos;s one connected career OS where every document, practice
              session, and insight is shaped by your goals — so the guidance
              compounds with every step you take.
            </p>
          </Reveal>
        </div>

        {/* Feature grid — strict 3 × 2, identical row heights, with thin
            connective trajectories weaving behind the cards */}
        <div className="relative mx-auto mt-14 max-w-6xl md:mt-16">
          <ConnectiveLines className="pointer-events-none absolute inset-0 hidden h-full w-full [mask-image:radial-gradient(ellipse_70%_75%_at_50%_50%,#000_30%,transparent_90%)] lg:block" />
          <RevealStagger
            className="relative grid auto-rows-fr grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3"
            stagger={0.08}
            delay={0.1}
          >
            {whyFeatures.map((feature, i) => (
              <RevealItem key={feature.title}>
                <WhyCard
                  index={i + 1}
                  icon={feature.icon}
                  tone={feature.tone}
                  title={feature.title}
                  description={feature.description}
                  visual={VISUALS[i]}
                />
              </RevealItem>
            ))}
          </RevealStagger>
        </div>

        {/* Bottom CTA — appears last, closes on a career-trajectory horizon */}
        <Reveal delay={0.12} className="relative mx-auto mt-20 max-w-2xl text-center md:mt-24">
          <HorizonArc />
          <h3 className="relative text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Run your career on AI.
          </h3>
          <p className="relative mx-auto mt-4 max-w-xl text-muted-foreground md:text-lg">
            Stop starting from zero. NovaNest remembers your career,
            coordinates the work, and compounds with every step.
          </p>
          <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/dashboard">
              <Button
                variant="gradient"
                size="lg"
                className="w-full gap-2 rounded-full px-7 sm:w-auto"
              >
                Start for free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="#demo">
              <Button
                size="lg"
                variant="outline"
                className="w-full gap-2 rounded-full px-7 sm:w-auto"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                See the OS
              </Button>
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}