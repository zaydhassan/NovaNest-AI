"use client";

import { motion } from "framer-motion";
import { TrendingUp, Brain, Briefcase, Sparkles, ArrowUpRight, CheckCircle2, Circle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const ease = [0.22, 1, 0.36, 1];

const kpis = [
  { icon: TrendingUp, label: "Market outlook", value: "Positive", accent: "text-accent-warm" },
  { icon: Brain, label: "NovaScore", value: "86", accent: "text-primary" },
  { icon: Briefcase, label: "Demand", value: "High", accent: "text-accent" },
];

const trends = [
  "AI/ML roles up 23% QoQ",
  "Rust enters top-10 demand skills",
  "Remote-first postings rebounding",
];

const skills = [
  { name: "React", have: true },
  { name: "System Design", have: true },
  { name: "Rust", have: false },
  { name: "Kubernetes", have: false },
  { name: "TypeScript", have: true },
];

/**
 * DashboardPreview — a richly animated, self-running mock of the in-app
 * executive dashboard. Conveys the product without screenshotting real data.
 */
export function DashboardPreview() {
  return (
    <div className="border-gradient mx-auto max-w-5xl shadow-glass-lg">
      <div className="rounded-[calc(var(--radius-2xl)-1px)] p-2">
        <div className="rounded-xl bg-background/50 p-4 md:p-6">
          {/* Top bar */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Welcome back, Alex</p>
              <p className="text-lg font-semibold">Your career workspace</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1.5">
                <Clock className="h-3 w-3" /> Updated 2h ago
              </Badge>
              <Badge className="gap-1.5">
                <Sparkles className="h-3 w-3" /> AI insights ready
              </Badge>
            </div>
          </div>

          {/* KPI row */}
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {kpis.map((k, i) => {
              const Icon = k.icon;
              return (
                <motion.div
                  key={k.label}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.5, ease }}
                  className="glass rounded-xl p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{k.label}</span>
                    <Icon className={`h-4 w-4 ${k.accent}`} />
                  </div>
                  <p className="mt-2 text-2xl font-bold">{k.value}</p>
                </motion.div>
              );
            })}
          </div>

          <div className="grid gap-4 md:grid-cols-[1.5fr_1fr]">
            {/* Chart */}
            <div className="glass rounded-xl p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold">Salary ranges by role</p>
                <span className="inline-flex items-center gap-1 text-xs text-accent-warm">
                  <ArrowUpRight className="h-3 w-3" /> +12.4%
                </span>
              </div>
              <div className="flex h-40 items-end gap-3">
                {[58, 82, 64, 96, 72, 88, 70].map((h, i) => (
                  <motion.div
                    key={i}
                    className="flex-1 rounded-t-md"
                    initial={{ height: 0 }}
                    whileInView={{ height: `${h}%` }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06, duration: 0.6, ease }}
                    style={{
                      background:
                        i % 3 === 0
                          ? "hsl(var(--cyan))"
                          : i % 3 === 1
                          ? "hsl(var(--purple))"
                          : "hsl(var(--emerald))",
                      opacity: 0.85,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Skill gap + trends */}
            <div className="space-y-4">
              <div className="glass rounded-xl p-5">
                <p className="mb-3 text-sm font-semibold">Skill coverage</p>
                <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-white/[0.08]">
                  <motion.div
                    className="h-full rounded-full ring-aurora"
                    initial={{ width: 0 }}
                    whileInView={{ width: "62%" }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease }}
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((s, i) => (
                    <motion.span
                      key={s.name}
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 + i * 0.05 }}
                      className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px]"
                    >
                      {s.have ? (
                        <CheckCircle2 className="h-3 w-3 text-accent-warm" />
                      ) : (
                        <Circle className="h-3 w-3 text-muted-foreground" />
                      )}
                      {s.name}
                    </motion.span>
                  ))}
                </div>
              </div>

              <div className="glass rounded-xl p-5">
                <p className="mb-3 text-sm font-semibold">Key trends</p>
                <ul className="space-y-2.5">
                  {trends.map((t, i) => (
                    <motion.li
                      key={t}
                      initial={{ opacity: 0, x: -8 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.08 }}
                      className="flex items-start gap-2 text-xs text-foreground/85"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ring-aurora" />
                      {t}
                    </motion.li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPreview;