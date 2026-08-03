"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Sparkles, TrendingUp, GraduationCap, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Magnetic } from "@/components/site/magnetic";
import { NeuralCanvas } from "@/components/site/neural-canvas";

const EASE = [0.22, 1, 0.36, 1];

/**
 * HeroSection — obsidian hero with:
 *  - an interactive neural-mesh canvas that reacts to the cursor
 *  - a cursor-following radial spotlight + floating gradient orbs
 *  - a staggered blur-in headline and magnetic CTAs
 *  - a glass product mock with a mini salary chart and stat tiles
 *
 * All decorative layers are aria-hidden and pointer-events-none. Reduced
 * motion: the canvas renders a static field and entrance animations collapse
 * to instant.
 */
export default function HeroSection() {
  const sectionRef = useRef(null);
  const rafRef = useRef(null);
  const reduced = useReducedMotion();

  const handleMouseMove = (e) => {
    if (reduced) return;
    const el = sectionRef.current;
    if (!el) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
      el.style.setProperty("--my", `${e.clientY - rect.top}px`);
    });
  };

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
  };
  const item = reduced
    ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 18, filter: "blur(10px)" },
        show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.7, ease: EASE } },
      };

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      className="spotlight relative w-full overflow-hidden px-4 pt-36 pb-16 md:pt-44 md:pb-28"
    >
      {/* Interactive neural mesh — sits behind everything, fades out at edges. */}
      <div className="pointer-events-none absolute inset-0 z-0 opacity-70 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_35%,#000_30%,transparent_85%)]">
        <NeuralCanvas className="h-full w-full" />
      </div>

      {/* Floating gradient orbs */}
      <div
        className="aurora-blob pointer-events-none"
        style={{ width: 280, height: 280, top: "12%", left: "8%", background: "hsl(var(--cyan))", opacity: 0.18, animation: "floaty 8s ease-in-out infinite" }}
        aria-hidden="true"
      />
      <div
        className="aurora-blob pointer-events-none"
        style={{ width: 220, height: 220, top: "30%", right: "10%", background: "hsl(var(--purple))", opacity: 0.20, animation: "floaty 10s ease-in-out infinite reverse" }}
        aria-hidden="true"
      />
      <div
        className="aurora-blob pointer-events-none"
        style={{ width: 180, height: 180, bottom: "18%", left: "22%", background: "hsl(var(--emerald))", opacity: 0.14, animation: "floaty 12s ease-in-out infinite" }}
        aria-hidden="true"
      />

      <div className="container relative z-10 mx-auto">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="mx-auto max-w-4xl text-center"
        >
          <motion.div variants={item}>
            <Badge className="mb-7 gap-2 border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-foreground/90 backdrop-blur-md hover:bg-white/[0.06]">
              <span className="flex h-4 w-4 items-center justify-center rounded-full ring-aurora">
                <Sparkles className="h-2.5 w-2.5 text-white" />
              </span>
              Now with Career Twin — an AI that knows your career
              <span className="ml-1 h-1.5 w-1.5 animate-pulse rounded-full bg-accent-warm" />
            </Badge>
          </motion.div>

          <motion.h1
            variants={item}
            className="aurora-text animate-aurora text-4xl font-extrabold leading-[1.05] sm:text-5xl md:text-6xl lg:text-7xl"
          >
            Your career, running on AI.
          </motion.h1>

          <motion.p
            variants={item}
            className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground md:text-lg"
          >
            NovaNest is the AI Career Operating System — one workspace that
            remembers everything you&apos;ve built, applied to, and practiced,
            then runs specialist AI agents across your resume, interviews, and
            applications. Not a chatbot. A system that compounds.
          </motion.p>

          <motion.div
            variants={item}
            className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Magnetic strength={0.4}>
              <Link href="/dashboard">
                <Button variant="gradient" size="lg" className="w-full gap-2 rounded-full px-7 sm:w-auto">
                  Start free
                  <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
                </Button>
              </Link>
            </Magnetic>
            <Magnetic strength={0.25}>
              <Link href="#demo">
                <Button size="lg" variant="outline" className="w-full rounded-full px-7 sm:w-auto">
                  <Play className="h-4 w-4" />
                  See the OS
                </Button>
              </Link>
            </Magnetic>
          </motion.div>

          <motion.p
            variants={item}
            className="mt-5 text-xs text-muted-foreground"
          >
            Free forever plan · No credit card · Your data never trains shared models
          </motion.p>
        </motion.div>

        {/* Product mock */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25, ease: EASE }}
          className="mx-auto mt-16 max-w-5xl"
        >
          <div className="border-gradient shadow-float">
            <div className="rounded-[calc(var(--radius-2xl)-1px)] p-2">
              {/* window chrome */}
              <div className="mb-2 flex items-center gap-1.5 px-3 py-2">
                <span className="h-3 w-3 rounded-full bg-rose-500/70" />
                <span className="h-3 w-3 rounded-full bg-amber-400/70" />
                <span className="h-3 w-3 rounded-full bg-accent-warm/80" />
                <span className="ml-3 text-xs text-muted-foreground">novanest.ai/dashboard</span>
                <span className="ml-auto hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] text-muted-foreground sm:inline-flex">
                  <Play className="h-2.5 w-2.5" /> Live preview
                </span>
              </div>

              <div className="grid gap-4 rounded-xl bg-background/40 p-4 md:grid-cols-[1.4fr_1fr]">
                {/* left: chart card */}
                <div className="glass rounded-xl p-5 shadow-card">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Salary ranges</p>
                      <p className="text-lg font-semibold">Senior Engineer · by role</p>
                    </div>
                    <Badge variant="secondary" className="gap-1 tnum">
                      <TrendingUp className="h-3 w-3 text-accent-warm" /> +12.4%
                    </Badge>
                  </div>
                  {/* SVG bar chart */}
                  <svg viewBox="0 0 320 140" className="h-32 w-full" role="img" aria-label="Salary ranges bar chart">
                    <defs>
                      <linearGradient id="bar1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="hsl(var(--cyan))" />
                        <stop offset="1" stopColor="hsl(var(--cyan) / 0.3)" />
                      </linearGradient>
                      <linearGradient id="bar2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="hsl(var(--purple))" />
                        <stop offset="1" stopColor="hsl(var(--purple) / 0.3)" />
                      </linearGradient>
                      <linearGradient id="bar3" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="hsl(var(--emerald))" />
                        <stop offset="1" stopColor="hsl(var(--emerald) / 0.3)" />
                      </linearGradient>
                    </defs>
                    {[0, 1, 2, 3].map((i) => {
                      const heights = [78, 52, 96, 64];
                      const colors = ["url(#bar1)", "url(#bar2)", "url(#bar3)", "url(#bar1)"];
                      const x = 12 + i * 78;
                      return (
                        <motion.rect
                          key={i}
                          x={x}
                          width={48}
                          rx={8}
                          fill={colors[i]}
                          initial={reduced ? false : { height: 0, y: 140 }}
                          animate={{ height: heights[i], y: 140 - heights[i] }}
                          transition={{ duration: 0.8, delay: 0.5 + i * 0.12, ease: EASE }}
                        />
                      );
                    })}
                  </svg>
                </div>

                {/* right: stat tiles */}
                <div className="grid gap-4">
                  <div className="glass rounded-xl p-5">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <GraduationCap className="h-4 w-4" />
                      <span className="text-sm">Interview readiness</span>
                    </div>
                    <p className="mt-2 text-2xl font-bold tnum">86%</p>
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/[0.08]">
                      <motion.div
                        className="h-full rounded-full ring-aurora"
                        initial={reduced ? false : { width: 0 }}
                        animate={{ width: "86%" }}
                        transition={{ duration: 1, delay: 0.6, ease: EASE }}
                      />
                    </div>
                  </div>
                  <div className="glass rounded-xl p-5">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Sparkles className="h-4 w-4" />
                      <span className="text-sm">AI suggestions</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {["System design", "Leadership", "Negotiation"].map((s, i) => (
                        <motion.span
                          key={s}
                          initial={reduced ? false : { opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.7 + i * 0.08 }}
                          className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-xs font-normal text-foreground/80"
                        >
                          {s}
                        </motion.span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}