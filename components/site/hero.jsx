"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Play,
  Sparkles,
  Bot,
  LayoutDashboard,
  Mic,
  UserRound,
  CreditCard,
  Infinity as InfinityIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroDashboard } from "@/components/site/hero-dashboard";

const EASE = [0.22, 1, 0.36, 1];

const CHIPS = [
  { label: "AI Copilot", icon: Bot },
  { label: "Smart Workspace", icon: LayoutDashboard },
  { label: "Interview Prep", icon: Mic },
  { label: "Career Twin", icon: UserRound },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

export default function HeroSection() {
  const reduced = useReducedMotion();

  const item = reduced
    ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 18, filter: "blur(10px)" },
        show: {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          transition: { duration: 0.7, ease: EASE },
        },
      };

  return (
    <section className="relative w-full overflow-hidden px-4 pt-28 pb-16 md:pt-36 md:pb-24">
      {/* Very subtle radial atmospheric gradient behind the hero — does not dominate */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 30% 25%, hsl(var(--accent) / 0.10), transparent 60%), radial-gradient(ellipse 60% 50% at 80% 30%, hsl(var(--primary) / 0.10), transparent 60%)",
        }}
      />
      {/* Faint grid texture, masked to fade out toward the bottom */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.5] [mask-image:radial-gradient(ellipse_75%_60%_at_50%_30%,#000_30%,transparent_85%)] grid-mesh"
      />

      <div className="container relative z-10 mx-auto">
        <div className="grid grid-cols-1 items-center gap-10 md:gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
          {/* LEFT — copy */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="max-w-xl lg:pl-6 lg:-translate-y-16"
          >
            {/* Announcement pill */}
            <motion.div variants={item}>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-foreground/90 backdrop-blur-md transition-colors hover:border-white/20">
                <span className="flex h-4 w-4 items-center justify-center rounded-full ring-aurora">
                  <Sparkles className="h-2.5 w-2.5 text-white" />
                </span>
                Career Twin is live — your AI that knows your career
                <span className="ml-0.5 h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={item}
              className="mt-6 font-display text-5xl font-bold leading-[1.04] tracking-tight text-foreground sm:text-6xl lg:text-[4.25rem]"
            >
              Your career,
              <br />
              <span className="aurora-text animate-aurora">intelligently</span>
              <br />
              accelerated.
            </motion.h1>

            {/* Supporting copy */}
            <motion.p
              variants={item}
              className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg"
            >
              NovaNest AI is your all-in-one career operating system. AI-powered
              tools, real-time insights, and a personal copilot that remembers your
              journey and helps you move forward.
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={item}
              className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center"
            >
              <Link href="/dashboard">
                <Button
                  variant="gradient"
                  size="lg"
                  className="w-full gap-2 rounded-xl px-6 sm:w-auto"
                >
                  Start for free
                  <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
                </Button>
              </Link>
              <Link href="#demo">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full gap-2 rounded-full px-6 sm:w-auto"
                >
                  <Play className="h-3.5 w-3.5" />
                  See the OS in action
                </Button>
              </Link>
            </motion.div>

            {/* Trust line */}
            <motion.div
              variants={item}
              className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted-foreground"
            >
              <span className="inline-flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5 text-accent" />
                No credit card
              </span>
              <span className="inline-flex items-center gap-1.5">
                <InfinityIcon className="h-3.5 w-3.5 text-accent" />
                Free forever plan
              </span>
            </motion.div>

            {/* Feature chips */}
            <motion.div
              variants={item}
              className="mt-7 flex flex-wrap gap-2"
            >
              {CHIPS.map(({ label, icon: Icon }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.02] px-3 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-white/15 hover:text-foreground/80"
                >
                  <Icon className="h-3.5 w-3.5 text-accent" />
                  {label}
                </span>
              ))}
            </motion.div>
          </motion.div>

          {/* RIGHT — Career Command Center preview */}
          <div className="relative">
            <HeroDashboard />
          </div>
        </div>
      </div>
    </section>
  );
}