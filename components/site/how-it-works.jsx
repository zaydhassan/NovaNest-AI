"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { SpotlightCard } from "@/components/site/spotlight-card";
import { Reveal, RevealStagger, RevealItem } from "@/components/site/reveal";
import { howItWorks } from "@/data/howItWorks";

const EASE = [0.22, 1, 0.36, 1];

// Step action labels — subtle closing row inside each card.
const ACTIONS = ["Get started", "Build momentum", "See it in action", "Grow over time"];

/* ------------------------------------------------------------------ */
/* Miniature card visuals — pure HTML/SVG, no extra dependencies.      */
/* ------------------------------------------------------------------ */

// 01 — layered career-context cards (Industry / Skills / Goal)
function CareerContextVisual({ reduced }) {
  const rows = [
    { label: "Industry", value: "Software Engineering" },
    { label: "Skills", value: "React · Python · AWS" },
    { label: "Goal", value: "AI Engineer" },
  ];
  return (
    <div className="relative flex h-28 flex-col justify-center gap-2">
      {rows.map((row, i) => (
        <motion.div
          key={row.label}
          className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.08] bg-white/[0.035] px-3 py-1.5 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset]"
          style={{ marginLeft: i * 12 }}
          animate={reduced ? undefined : { y: [0, -2.5, 0] }}
          transition={{ duration: 5 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.6 }}
        >
          <span className="text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {row.label}
          </span>
          <span className="truncate text-[11px] font-medium text-foreground/90">{row.value}</span>
        </motion.div>
      ))}
    </div>
  );
}

// 02 — workspace sources flowing into one central memory layer
function MemoryFlowVisual({ reduced }) {
  const chips = [
    { label: "Resume", x: 24, y: 20 },
    { label: "Interview", x: 76, y: 20 },
    { label: "Applications", x: 24, y: 46 },
    { label: "Learning", x: 76, y: 46 },
  ];
  const paths = [
    "M24 28 C24 52 50 58 50 82",
    "M76 28 C76 52 50 58 50 82",
    "M24 54 C24 66 50 70 50 82",
    "M76 54 C76 66 50 70 50 82",
  ];
  return (
    <div className="relative h-28">
      <svg
        viewBox="0 0 100 112"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        {paths.map((d, i) =>
          reduced ? (
            <path
              key={i}
              d={d}
              fill="none"
              stroke="hsl(var(--accent) / 0.30)"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          ) : (
            <motion.path
              key={i}
              d={d}
              fill="none"
              stroke="hsl(var(--accent) / 0.30)"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.8, delay: 0.45 + i * 0.1, ease: EASE }}
            />
          )
        )}
      </svg>
      {chips.map((chip) => (
        <span
          key={chip.label}
          className="absolute inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 whitespace-nowrap rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] font-medium text-foreground/85 backdrop-blur-sm"
          style={{ left: `${chip.x}%`, top: `${chip.y}%` }}
        >
          <span className="h-1 w-1 rounded-full bg-accent/70" aria-hidden="true" />
          {chip.label}
        </span>
      ))}
      <span
        className="absolute left-1/2 top-[84%] -translate-x-1/2 -translate-y-1/2"
        aria-hidden="true"
      >
        <span className="absolute -inset-1.5 rounded-full bg-accent/25 blur-md" />
        <span className="relative flex items-center gap-1.5 rounded-full ring-aurora p-px">
          <span className="flex items-center gap-1.5 rounded-full bg-background px-3 py-1 text-[10px] font-semibold text-white">
            <Sparkles className="h-2.5 w-2.5" />
            Career Memory
          </span>
        </span>
      </span>
    </div>
  );
}

// 03 — central OS node routing to four specialists
function RoutingVisual({ reduced }) {
  const specialists = [
    { label: "Resume", x: 20, y: 20 },
    { label: "Interview", x: 80, y: 20 },
    { label: "Applications", x: 20, y: 82 },
    { label: "Analytics", x: 80, y: 82 },
  ];
  return (
    <div className="relative h-28">
      <svg
        viewBox="0 0 100 112"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        {specialists.map((s, i) =>
          reduced ? (
            <path
              key={i}
              d={`M50 56 L${s.x} ${s.y}`}
              fill="none"
              stroke="hsl(var(--foreground) / 0.14)"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          ) : (
            <motion.path
              key={i}
              d={`M50 56 L${s.x} ${s.y}`}
              fill="none"
              stroke="hsl(var(--foreground) / 0.14)"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.7, delay: 0.45 + i * 0.08, ease: EASE }}
            />
          )
        )}
      </svg>
      <span
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        aria-hidden="true"
      >
        <motion.span
          className="absolute -inset-2 rounded-full bg-primary/25 blur-md"
          animate={reduced ? undefined : { opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        />
        <span className="relative flex h-10 w-10 items-center justify-center rounded-full ring-aurora p-px shadow-glow">
          <span className="flex h-full w-full items-center justify-center rounded-full bg-background">
            <Sparkles className="h-4 w-4 text-white" />
          </span>
        </span>
      </span>
      {specialists.map((s) => (
        <span
          key={s.label}
          className="absolute inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 whitespace-nowrap rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] font-medium text-foreground/85 backdrop-blur-sm"
          style={{ left: `${s.x}%`, top: `${s.y}%` }}
        >
          <span className="h-1 w-1 rounded-full bg-primary/70" aria-hidden="true" />
          {s.label}
        </span>
      ))}
    </div>
  );
}

// 04 — ascending compounding trajectory ending in a glowing node
function CompoundingVisual({ reduced }) {
  const d = "M12 64 C 55 60 75 50 105 44 C 135 38 165 28 195 20 C 205 17 215 13 226 10";
  return (
    <div className="relative flex h-28 flex-col justify-center">
      <svg viewBox="0 0 240 76" preserveAspectRatio="none" className="h-16 w-full" aria-hidden="true">
        <defs>
          <linearGradient id="hiw-rise" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="hsl(var(--accent))" stopOpacity="0.15" />
            <stop offset="1" stopColor="hsl(var(--primary))" stopOpacity="0.55" />
          </linearGradient>
          <linearGradient id="hiw-rise-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="hsl(var(--accent))" stopOpacity="0.12" />
            <stop offset="1" stopColor="hsl(var(--accent))" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${d} L226 76 L12 76 Z`} fill="url(#hiw-rise-area)" stroke="none" />
        {reduced ? (
          <path d={d} fill="none" stroke="url(#hiw-rise)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
        ) : (
          <motion.path
            d={d}
            fill="none"
            stroke="url(#hiw-rise)"
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 1.1, delay: 0.45, ease: EASE }}
          />
        )}
        {[
          [12, 64],
          [78, 49],
          [148, 32],
          [200, 17],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={2} fill="hsl(var(--accent) / 0.6)" />
        ))}
        <circle cx={226} cy={10} r={5} fill="hsl(var(--primary) / 0.35)" />
        <circle cx={226} cy={10} r={2.5} fill="hsl(var(--primary))" />
      </svg>
      <div className="mt-1 flex justify-between text-[9px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        <span>Health</span>
        <span>Skills</span>
        <span>Apps</span>
        <span>Interview</span>
        <span className="text-foreground/70">Growth</span>
      </div>
    </div>
  );
}

const VISUALS = [CareerContextVisual, MemoryFlowVisual, RoutingVisual, CompoundingVisual];

/* ------------------------------------------------------------------ */
/* Section                                                              */
/* ------------------------------------------------------------------ */

export function HowItWorks() {
  const reduced = useReducedMotion();

  // Journey trajectory: a gentle wave passing through the four number-node
  // centers (desktop, 4-column grid). Coordinates assume max-w-6xl (1152px)
  // with gap-6 — node centers sit at x = 50 / 344 / 638 / 932, y = 26.
  const journeyPath =
    "M50 26 C 140 12, 250 40, 344 26 C 438 12, 544 40, 638 26 C 732 12, 838 40, 932 26";

  return (
    <section className="section relative overflow-hidden" aria-labelledby="how-it-works-title">
      {/* Quiet atmosphere: faint grid + magenta/violet glows, kept far back */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 55% 45% at 15% 20%, hsl(var(--accent) / 0.07), transparent 60%), radial-gradient(ellipse 50% 40% at 85% 30%, hsl(var(--primary) / 0.07), transparent 60%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-50 [mask-image:radial-gradient(ellipse_70%_55%_at_50%_35%,#000_25%,transparent_80%)] grid-mesh"
      />

      <div className="container relative z-10 mx-auto px-4">
        {/* Header */}
        <Reveal className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full ring-aurora" aria-hidden="true" />
            How it works
          </span>
          <h2
            id="how-it-works-title"
            className="mt-5 text-3xl font-extrabold tracking-tight text-foreground md:text-4xl lg:text-5xl"
          >
            Set up once. It remembers <span className="aurora-text">forever.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-[760px] text-base text-muted-foreground md:text-lg">
            Every action you take writes to memory — so the system gets richer, and the guidance
            gets sharper, with every step.
          </p>
        </Reveal>

        {/* Cards + journey */}
        <div className="relative mx-auto mt-14 max-w-6xl lg:mt-16">
          {/* Connecting trajectory (desktop only) — sits behind the number nodes */}
          <div
            className="pointer-events-none absolute left-0 right-0 top-[24px] hidden h-[52px] lg:block"
            aria-hidden="true"
          >
            <svg viewBox="0 0 1152 52" preserveAspectRatio="none" className="h-full w-full">
              <defs>
                <linearGradient id="hiw-journey" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stopColor="hsl(var(--accent))" />
                  <stop offset="0.55" stopColor="hsl(var(--primary))" />
                  <stop offset="1" stopColor="hsl(var(--primary))" stopOpacity="0.25" />
                </linearGradient>
              </defs>
              {reduced ? (
                <>
                  <path
                    d={journeyPath}
                    fill="none"
                    stroke="url(#hiw-journey)"
                    strokeWidth={5}
                    style={{ filter: "blur(5px)", opacity: 0.35 }}
                  />
                  <path d={journeyPath} fill="none" stroke="url(#hiw-journey)" strokeWidth={1.5} />
                </>
              ) : (
                <>
                  <motion.path
                    d={journeyPath}
                    fill="none"
                    stroke="url(#hiw-journey)"
                    strokeWidth={5}
                    style={{ filter: "blur(5px)", opacity: 0.35 }}
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 1.3, delay: 0.6, ease: "easeInOut" }}
                  />
                  <motion.path
                    d={journeyPath}
                    fill="none"
                    stroke="url(#hiw-journey)"
                    strokeWidth={1.5}
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 1.3, delay: 0.6, ease: "easeInOut" }}
                  />
                </>
              )}
            </svg>
          </div>

          <RevealStagger className="relative grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4" stagger={0.1}>
            {howItWorks.map((item, i) => {
              const Visual = VISUALS[i];
              return (
                <RevealItem key={item.title} className="relative">
                  {/* Mobile connector: vertical drop between stacked steps */}
                  {i < 3 && (
                    <span
                      aria-hidden="true"
                      className="absolute left-1/2 top-full h-6 w-px -translate-x-1/2 bg-gradient-to-b from-white/20 to-transparent md:hidden"
                    />
                  )}
                  <SpotlightCard className="glass group flex h-full flex-col rounded-[20px] p-6 transition-all duration-300 ease-spring motion-safe:hover:-translate-y-1 hover:border-white/20">
                    {/* Internal gradient sheen */}
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-0 top-0 h-24 rounded-t-[20px] bg-gradient-to-b from-white/[0.035] to-transparent"
                    />

                    {/* Number node */}
                    <div className="relative mb-5 h-11 w-11">
                      <span
                        aria-hidden="true"
                        className="absolute -inset-1 rounded-full bg-gradient-to-br from-accent to-primary opacity-25 blur-md transition-opacity duration-300 group-hover:opacity-60"
                      />
                      {reduced ? (
                        <span className="relative flex h-full w-full items-center justify-center rounded-full ring-aurora p-px shadow-glow">
                          <NodeInner index={i} />
                        </span>
                      ) : (
                        <motion.span
                          className="relative flex h-full w-full items-center justify-center rounded-full ring-aurora p-px shadow-glow"
                          initial={{ opacity: 0, scale: 0.6 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true, amount: 0.4 }}
                          transition={{ duration: 0.5, delay: 0.35 + i * 0.12, ease: EASE }}
                        >
                          <NodeInner index={i} />
                        </motion.span>
                      )}
                    </div>

                    {/* Miniature visual */}
                    <div className="relative mb-5 opacity-90 transition-opacity duration-300 group-hover:opacity-100">
                      <Visual reduced={reduced} />
                    </div>

                    {/* Content */}
                    <h3 className="text-base font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>

                    {/* Action row — pinned to the card bottom */}
                    <div className="mt-auto flex items-center gap-2 pt-5 text-xs font-medium tracking-wide text-muted-foreground transition-colors duration-300 group-hover:text-foreground/80">
                      <span>{ACTIONS[i]}</span>
                      <ArrowRight
                        className="h-3.5 w-3.5 transition-transform duration-300 ease-spring motion-safe:group-hover:translate-x-1"
                        aria-hidden="true"
                      />
                    </div>
                  </SpotlightCard>
                </RevealItem>
              );
            })}
          </RevealStagger>
        </div>

        {/* Closing statement */}
        <Reveal delay={0.15} className="mt-12 flex items-center justify-center gap-6 lg:mt-14">
          <span
            aria-hidden="true"
            className="h-px w-16 bg-gradient-to-r from-transparent to-white/15 md:w-28"
          />
          <span className="whitespace-nowrap text-[11px] font-medium uppercase tracking-[0.35em] text-muted-foreground">
            Same effort. A smarter you.
          </span>
          <span
            aria-hidden="true"
            className="h-px w-16 bg-gradient-to-l from-transparent to-white/15 md:w-28"
          />
        </Reveal>
      </div>
    </section>
  );
}

function NodeInner({ index }) {
  return (
    <span className="tnum flex h-full w-full items-center justify-center rounded-full bg-background text-[13px] font-semibold tracking-wide text-white">
      {String(index + 1).padStart(2, "0")}
    </span>
  );
}

export default HowItWorks;