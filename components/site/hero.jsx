"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, TrendingUp, FileText, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const float = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
};

/**
 * HeroSection — aurora hero with headline, dual CTAs, and a CSS/SVG product
 * mock (no image payload). The mock is a stylized "dashboard" card with a
 * mini salary chart and stat tiles — conveys the product without shipping
 * the previous 2.3MB banner.png.
 */
export default function HeroSection() {
  return (
    <section className="relative w-full px-4 pt-36 pb-16 md:pt-44 md:pb-24">
      <div className="container mx-auto">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge className="mb-6 gap-1.5 border-primary/30 bg-primary/10 text-primary hover:bg-primary/15">
              <Sparkles className="h-3.5 w-3.5" />
              Now with AI-powered interview prep
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="aurora-text animate-aurora text-4xl font-extrabold leading-[1.05] sm:text-5xl md:text-6xl lg:text-7xl"
          >
            Your AI career growth OS
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground md:text-lg"
          >
            Build ATS-optimized resumes, practice role-specific interviews,
            generate cover letters, and track live industry insights — all in
            one polished workspace.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18 }}
            className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Link href="/dashboard">
              <Button size="lg" className="w-full gap-2 rounded-full px-7 shadow-glow sm:w-auto">
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
        </div>

        {/* Product mock */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
          className="mx-auto mt-16 max-w-5xl"
        >
          <div className="glass-strong relative rounded-2xl p-2 shadow-glass">
            {/* window chrome */}
            <div className="mb-2 flex items-center gap-1.5 px-3 py-2">
              <span className="h-3 w-3 rounded-full bg-red-400/80" />
              <span className="h-3 w-3 rounded-full bg-amber-400/80" />
              <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
              <span className="ml-3 text-xs text-muted-foreground">novanest.ai/dashboard</span>
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
                    <TrendingUp className="h-3 w-3" /> +12.4%
                  </Badge>
                </div>
                {/* SVG bar chart */}
                <svg viewBox="0 0 320 140" className="h-32 w-full" role="img" aria-label="Salary ranges bar chart">
                  <defs>
                    <linearGradient id="bar1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="hsl(var(--chart-1))" />
                      <stop offset="1" stopColor="hsl(var(--chart-1) / 0.3)" />
                    </linearGradient>
                    <linearGradient id="bar2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="hsl(var(--chart-3))" />
                      <stop offset="1" stopColor="hsl(var(--chart-3) / 0.3)" />
                    </linearGradient>
                    <linearGradient id="bar3" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="hsl(var(--chart-4))" />
                      <stop offset="1" stopColor="hsl(var(--chart-4) / 0.3)" />
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
                        transition={{ duration: 0.8, delay: 0.5 + i * 0.12 }}
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
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full w-[86%] rounded-full ring-aurora" />
                  </div>
                </div>
                <div className="glass rounded-xl p-5">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-sm">AI suggestions</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {["System design", "Leadership", "Negotiation"].map((s) => (
                      <Badge key={s} variant="outline" className="font-normal">{s}</Badge>
                    ))}
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