"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Mic,
  FileText,
  Mail,
  Send,
  Target,
  Compass,
  BookOpen,
} from "lucide-react";
import { features } from "@/data/features";
import SpotlightCard from "@/components/site/spotlight-card";

const ease = [0.22, 1, 0.36, 1];

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
};

// Compact product-interface visualizations — one per pillar, in card order.
// Rendered inside a shared inset panel so they read as pieces of the product.
const miniPanels = [
  // 01 — AI Copilot: a tiny conversation thread
  <div className="space-y-1.5">
    <div className="flex items-center gap-1.5 rounded-md border border-white/[0.06] bg-white/[0.03] px-2.5 py-1.5 text-[11px] text-foreground/50">
      <Sparkles className="h-3 w-3 shrink-0 text-fuchsia-300" />
      Ask anything...
    </div>
    {["Tailored to your career", "Real, actionable advice"].map((line) => (
      <div
        key={line}
        className="rounded-md rounded-tl-none border border-violet-400/10 bg-violet-400/[0.08] px-2.5 py-1.5 text-[11px] text-violet-200/80"
      >
        {line}
      </div>
    ))}
  </div>,
  // 02 — Career Intelligence: circular health score + trend line
  <div className="flex items-center gap-3.5">
    <svg width="46" height="46" viewBox="0 0 46 46" aria-hidden="true">
      <circle cx="23" cy="23" r="18" fill="none" stroke="hsl(0 0% 100% / 0.08)" strokeWidth="4" />
      <circle
        cx="23"
        cy="23"
        r="18"
        fill="none"
        stroke="#A855F7"
        strokeWidth="4"
        strokeDasharray={`${2 * Math.PI * 18 * 0.78} 999`}
        strokeLinecap="round"
        transform="rotate(-90 23 23)"
      />
      <text x="23" y="27" textAnchor="middle" fontSize="12" fontWeight="600" fill="#F5F5F7">
        78
      </text>
    </svg>
    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-foreground/40">
        Career health
      </p>
      <svg viewBox="0 0 100 24" className="mt-1.5 h-6 w-full" aria-hidden="true">
        <polyline
          points="0,20 18,16 36,17 54,10 72,7 100,3"
          fill="none"
          stroke="#8B5CF6"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  </div>,
  // 03 — Career Workspace: connected tool stack + ATS badge
  <div className="grid grid-cols-2 gap-1.5">
    {[
      { icon: FileText, label: "Resume", badge: "ATS 92" },
      { icon: Mail, label: "Cover Letter" },
      { icon: Send, label: "Outreach" },
      { icon: Target, label: "Job Fit" },
    ].map(({ icon: Icon, label, badge }) => (
      <div
        key={label}
        className="flex items-center gap-1.5 rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-1.5 text-[11px] text-foreground/60"
      >
        <Icon className="h-3 w-3 shrink-0 text-violet-300" />
        <span className="truncate">{label}</span>
        {badge && (
          <span className="ml-auto shrink-0 rounded bg-fuchsia-400/15 px-1 py-0.5 text-[9px] font-semibold text-fuchsia-200">
            {badge}
          </span>
        )}
      </div>
    ))}
  </div>,
  // 04 — Applications: pipeline from Saved to Offer
  <div className="flex items-center gap-1">
    {["Saved", "Applied", "Interview", "Offer"].map((stage, i, all) => (
      <React.Fragment key={stage}>
        <span
          className={
            i === all.length - 1
              ? "shrink-0 rounded-md border border-fuchsia-400/25 bg-fuchsia-400/15 px-2 py-1 text-[10px] font-semibold text-fuchsia-100"
              : "shrink-0 rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-1 text-[10px] text-foreground/55"
          }
        >
          {stage}
        </span>
        {i < all.length - 1 && <span className="h-px min-w-2 flex-1 bg-white/10" />}
      </React.Fragment>
    ))}
  </div>,
  // 05 — Interview Prep: mic + waveform + timer + AI feedback
  <div className="space-y-2">
    <div className="flex items-center gap-2.5">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-fuchsia-400/20 bg-fuchsia-400/10">
        <Mic className="h-3.5 w-3.5 text-fuchsia-200" />
      </span>
      <span className="flex h-7 flex-1 items-end gap-[2px]" aria-hidden="true">
        {[8, 14, 10, 18, 12, 20, 16, 22, 14, 18, 10, 16, 8, 12].map((h, i) => (
          <span
            key={i}
            style={{ height: `${h}px` }}
            className="w-[3px] rounded-full bg-violet-400/50"
          />
        ))}
      </span>
      <span className="shrink-0 rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-1 text-[10px] tabular-nums text-foreground/55">
        12:40
      </span>
    </div>
    <div className="flex items-center gap-1.5 rounded-md border border-violet-400/10 bg-violet-400/[0.07] px-2.5 py-1.5 text-[11px] text-violet-100/80">
      <Sparkles className="h-3 w-3 shrink-0 text-fuchsia-300" />
      AI Feedback
    </div>
  </div>,
  // 06 — Learning: recommendation + roadmap progress
  <div className="space-y-2">
    <div className="flex items-center gap-1.5 text-[11px] text-foreground/60">
      <Compass className="h-3 w-3 shrink-0 text-fuchsia-300" />
      Recommended: System Design
    </div>
    <div className="h-1 overflow-hidden rounded-full bg-white/[0.07]">
      <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-fuchsia-400 to-violet-400" />
    </div>
    <div className="flex items-center gap-1.5 text-[10px] text-foreground/40">
      <BookOpen className="h-3 w-3 shrink-0 text-violet-300" />
      Skill roadmap · Step 4 of 6
    </div>
  </div>,
];

export function SixPillars() {
  return (
    <section
      id="features"
      className="relative overflow-hidden border-y border-white/[0.05] bg-[#07070B] py-16 md:py-28"
    >
      {/* Radial atmosphere: deep violet upper-left, deep magenta upper-right */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(900px circle at 14% -10%, hsl(293 84% 45% / 0.08), transparent 70%), radial-gradient(900px circle at 86% -10%, hsl(258 90% 55% / 0.07), transparent 70%)",
        }}
      />
      {/* Technical grid: thin 1px lines, large spacing, fading into the dark */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, hsl(0 0% 100% / 0.028) 1px, transparent 1px), linear-gradient(to bottom, hsl(0 0% 100% / 0.028) 1px, transparent 1px)",
          backgroundSize: "96px 96px",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 55% at 50% 40%, #000 30%, transparent 100%)",
          maskImage:
            "radial-gradient(ellipse 70% 55% at 50% 40%, #000 30%, transparent 100%)",
        }}
      />
      {/* Orbital path + glowing nodes behind the grid (desktop only) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[64%] -z-10 hidden h-[1300px] w-[2100px] -translate-x-1/2 rounded-[50%] border border-[hsl(271_91%_65%/0.12)] lg:block"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[18%] top-[38%] -z-10 hidden h-1.5 w-1.5 rounded-full bg-fuchsia-400 shadow-[0_0_10px_2px_hsl(293_84%_65%/0.5)] lg:block"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[16%] top-[76%] -z-10 hidden h-1 w-1 rounded-full bg-violet-400 shadow-[0_0_10px_2px_hsl(258_90%_70%/0.45)] lg:block"
      />

      <div className="container mx-auto px-4">
        {/* Header entrance: eyebrow fades, headline rises, description fades */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease }}
          className="text-center text-[11px] font-semibold uppercase tracking-[0.3em] text-fuchsia-300/70"
        >
          The system
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease }}
          className="mx-auto mt-4 max-w-4xl text-center text-[clamp(42px,5vw,68px)] font-bold leading-[1.05] tracking-tight text-[#F5F5F7]"
        >
          Six pillars.{" "}
          <span className="bg-gradient-to-r from-fuchsia-400 to-violet-400 bg-clip-text text-transparent">
            One operating system.
          </span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease, delay: 0.1 }}
          className="mx-auto mt-5 max-w-[700px] text-center text-[18px] leading-[1.6] text-[#9292A3] md:text-[19px]"
        >
          Every pillar feeds the next — your work doesn&apos;t sit in silos, it compounds.
        </motion.p>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          className="mx-auto mt-14 grid max-w-6xl grid-cols-1 gap-6 md:mt-16 md:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature, index) => (
            <motion.div key={index} variants={fadeUp}>
              <SpotlightCard className="group h-full rounded-[22px] border border-white/[0.09] bg-[#0D0D12] p-7 shadow-[inset_0_1px_0_hsl(0_0%_100%/0.04)] transition-all duration-300 ease-spring hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_18px_56px_-20px_hsl(293_84%_45%/0.22)] lg:p-8">
                <div className="flex items-start justify-between">
                  <span className="mt-1 text-[11px] font-medium tracking-[0.2em] text-fuchsia-300/50">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="grid h-11 w-11 place-items-center rounded-xl border border-violet-400/15 bg-violet-400/[0.06] text-fuchsia-300">
                    {feature.icon}
                  </span>
                </div>
                <h3 className="mt-5 text-[19px] font-semibold text-[#F5F5F7]">
                  {feature.title}
                </h3>
                <p className="mt-1 text-[13.5px] font-medium text-violet-200/70">
                  {feature.value}
                </p>
                <p className="mt-3 text-[14px] leading-[1.6] text-[#9292A3]">
                  {feature.description}
                </p>
                <div className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.015] p-3">
                  {miniPanels[index]}
                </div>
                <div className="mt-5 flex justify-end">
                  <span className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/[0.03] text-foreground/55 transition-all duration-300 ease-spring motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:border-fuchsia-300/40 motion-safe:group-hover:bg-fuchsia-400/10 motion-safe:group-hover:text-fuchsia-200">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </SpotlightCard>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.7, ease, delay: 0.2 }}
          className="mt-14 flex items-center justify-center gap-2 text-[10px] font-medium uppercase tracking-[0.35em] text-foreground/30"
        >
          <Sparkles className="h-3 w-3 text-fuchsia-300/60" />
          Your career. Amplified.
        </motion.div>
      </div>
    </section>
  );
}

export default SixPillars;