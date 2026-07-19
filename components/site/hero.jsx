"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, TrendingUp, FileText, GraduationCap, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ease = [0.22, 1, 0.36, 1];

/**
 * HeroSection — obsidian hero with a cursor-following radial spotlight,
 * floating gradient orbs, a glass badge, gradient headline, dual CTAs, and a
 * CSS/SVG product mock (no image payload). The mock is a stylized "dashboard"
 * card with a mini salary chart and stat tiles — conveys the product without
 * shipping a heavy banner image.
 */
export default function HeroSection() {
  const sectionRef = useRef(null);
  const rafRef = useRef(null);

  const handleMouseMove = (e) => {
    const el = sectionRef.current;
    if (!el) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
      el.style.setProperty("--my", `${e.clientY - rect.top}px`);
    });
  };

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      className="spotlight relative w-full overflow-hidden px-4 pt-36 pb-16 md:pt-44 md:pb-28"
    >
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

      <div className="container relative mx-auto">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
          >
            <Badge className="mb-7 gap-2 border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-foreground/90 backdrop-blur-md hover:bg-white/[0.06]">
              <span className="flex h-4 w-4 items-center justify-center rounded-full ring-aurora">
                <Sparkles className="h-2.5 w-2.5 text-white" />
              </span>
              Now with AI-powered interview prep
              <span className="ml-1 h-1.5 w-1.5 rounded-full bg-accent-warm" />
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05, ease }}
            className="aurora-text animate-aurora text-4xl font-extrabold leading-[1.05] sm:text-5xl md:text-6xl lg:text-7xl"
          >
            Your AI career growth OS
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12, ease }}
            className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground md:text-lg"
          >
            Build ATS-optimized resumes, practice role-specific interviews,
            generate cover letters, and track live industry insights — all in
            one polished workspace.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18, ease }}
            className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Link href="/dashboard">
              <Button variant="gradient" size="lg" className="w-full gap-2 rounded-full px-7 sm:w-auto">
                Get started free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/resume">
              <Button size="lg" variant="outline" className="w-full rounded-full px-7 sm:w-auto">
                <FileText className="h-4 w-4" />
                Try the resume builder
              </Button>
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-5 text-xs text-muted-foreground"
          >
            No credit card required · Free forever plan
          </motion.p>
        </div>

        {/* Product mock */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25, ease }}
          className="mx-auto mt-16 max-w-5xl"
        >
          <div className="border-gradient shadow-glass-lg">
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
                <div className="glass rounded-xl p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Salary ranges</p>
                      <p className="text-lg font-semibold">Senior Engineer · by role</p>
                    </div>
                    <Badge variant="secondary" className="gap-1">
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
                          initial={{ height: 0, y: 140 }}
                          animate={{ height: heights[i], y: 140 - heights[i] }}
                          transition={{ duration: 0.8, delay: 0.5 + i * 0.12, ease }}
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
                    <p className="mt-2 text-2xl font-bold">86%</p>
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/[0.08]">
                      <motion.div
                        className="h-full rounded-full ring-aurora"
                        initial={{ width: 0 }}
                        animate={{ width: "86%" }}
                        transition={{ duration: 1, delay: 0.6, ease }}
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
                          initial={{ opacity: 0, y: 6 }}
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