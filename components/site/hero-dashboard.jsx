"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  GraduationCap,
  Briefcase,
  FileText,
  CheckCircle2,
  Circle,
  Sparkles,
  ArrowRight,
  CalendarClock,
  BookOpen,
  Hammer,
  Send,
  Users,
  Award,
} from "lucide-react";

const EASE = [0.22, 1, 0.36, 1];

/**
 * Career Command Center — a marketing preview of the real NovaNest workspace.
 *
 * This is a PRESENTATION component only. The values below are static sample
 * data used to illustrate the product surface on the landing hero. It does
 * NOT read from the database, the auth context, or any real user state, and it
 * must never be confused with the live /dashboard route (which renders real
 * user metrics). Kept intentionally self-contained so the hero stays a mock.
 */

const METRICS = [
  {
    icon: Activity,
    label: "Career Health",
    value: "87",
    unit: "/100",
    status: "Excellent",
    accent: true,
    progress: 87,
  },
  {
    icon: GraduationCap,
    label: "Interview Readiness",
    value: "81",
    unit: "%",
    status: "Strong",
    accent: true,
    progress: 81,
  },
  {
    icon: Briefcase,
    label: "Applications",
    value: "24",
    unit: "",
    status: "Total applied",
    accent: false,
  },
  {
    icon: FileText,
    label: "Resume Score",
    value: "92",
    unit: "%",
    status: "ATS optimized",
    accent: true,
    progress: 92,
  },
];

const MISSION = [
  { label: "Practice System Design", done: true },
  { label: "Apply to 3 new jobs", done: false },
  { label: "Update resume", done: false },
  { label: "Mock interview", done: false },
];

const TIMELINE = [
  { icon: BookOpen, label: "Learning" },
  { icon: Hammer, label: "Built projects" },
  { icon: Send, label: "Applied" },
  { icon: Users, label: "Interview" },
  { icon: Award, label: "Offer", highlight: true },
];

function MetricTile({ m, i }) {
  const reduced = useReducedMotion();
  const Icon = m.icon;
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.15 + i * 0.07, duration: 0.5, ease: EASE }}
      className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-3.5"
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {m.label}
        </span>
        <Icon
          className={`h-3.5 w-3.5 ${m.accent ? "text-accent" : "text-muted-foreground"}`}
        />
      </div>
      <div className="mt-2 flex items-baseline gap-0.5">
        <span className="text-2xl font-bold tabular-nums tracking-tight text-foreground">
          {m.value}
        </span>
        {m.unit && (
          <span className="text-xs font-medium text-muted-foreground">{m.unit}</span>
        )}
      </div>
      <div className="mt-1 flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">{m.status}</span>
      </div>
      {typeof m.progress === "number" && (
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
          <motion.div
            className="h-full rounded-full cta-gradient"
            initial={reduced ? false : { width: 0 }}
            whileInView={{ width: `${m.progress}%` }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 + i * 0.07, duration: 0.8, ease: EASE }}
          />
        </div>
      )}
    </motion.div>
  );
}

export function HeroDashboard() {
  const reduced = useReducedMotion();

  return (
    <div className="relative">
      {/* Subtle pink/violet ambient glow behind the dashboard — kept very low */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-x-10 -top-10 bottom-0 -z-10 opacity-60"
        style={{
          background:
            "radial-gradient(60% 55% at 70% 20%, hsl(var(--accent) / 0.18), transparent 70%), radial-gradient(50% 50% at 30% 80%, hsl(var(--primary) / 0.14), transparent 70%)",
          filter: "blur(20px)",
        }}
      />

      <motion.div
        initial={reduced ? false : { opacity: 0, scale: 0.965, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
        className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-card shadow-[0_30px_80px_-30px_rgba(0,0,0,0.75)]"
      >
        {/* Top app bar */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/50" />
            </span>
            <span className="ml-2 text-xs font-medium text-muted-foreground">
              novanest.ai/dashboard
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
            AI · synced
          </span>
        </div>

        {/* Title */}
        <div className="flex items-center justify-between px-5 pt-5">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Career Operating System
            </p>
            <h3 className="mt-0.5 font-display text-lg font-bold tracking-tight text-foreground">
              Career Command Center
            </h3>
          </div>
          <CalendarClock className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-3 px-5 pt-4">
          {METRICS.map((m, i) => (
            <MetricTile key={m.label} m={m} i={i} />
          ))}
        </div>

        {/* Mission + Timeline */}
        <div className="grid grid-cols-1 gap-3 px-5 pt-3 sm:grid-cols-[1.1fr_1fr]">
          {/* Today's Mission */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="grid h-5 w-5 place-items-center rounded-md ring-aurora text-white">
                <Sparkles className="h-3 w-3" />
              </span>
              <span className="text-xs font-semibold text-foreground">Today&rsquo;s Mission</span>
            </div>
            <ul className="space-y-2">
              {MISSION.map((item, i) => (
                <motion.li
                  key={item.label}
                  initial={reduced ? false : { opacity: 0, x: -6 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.35 + i * 0.06, ease: EASE }}
                  className="flex items-center gap-2.5 text-xs"
                >
                  {item.done ? (
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-accent" />
                  ) : (
                    <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                  )}
                  <span
                    className={
                      item.done
                        ? "text-foreground/80 line-through decoration-muted-foreground/40"
                        : "text-foreground/90"
                    }
                  >
                    {item.label}
                  </span>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Career Timeline */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="grid h-5 w-5 place-items-center rounded-md bg-primary/15 text-primary">
                <Activity className="h-3 w-3" />
              </span>
              <span className="text-xs font-semibold text-foreground">Career Timeline</span>
            </div>
            <ol className="relative space-y-2.5 pl-4">
              <span className="absolute left-[3px] top-1.5 bottom-1.5 w-px bg-white/10" aria-hidden="true" />
              {TIMELINE.map((t, i) => {
                const Icon = t.icon;
                return (
                  <motion.li
                    key={t.label}
                    initial={reduced ? false : { opacity: 0, x: -6 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 + i * 0.06, ease: EASE }}
                    className="relative flex items-center gap-2 text-[11px]"
                  >
                    <span
                      className={`absolute -left-[13px] grid h-2.5 w-2.5 place-items-center rounded-full ring-2 ring-card ${
                        t.highlight ? "ring-aurora" : "bg-muted-foreground/50"
                      }`}
                    />
                    <Icon
                      className={`h-3 w-3 shrink-0 ${
                        t.highlight ? "text-accent" : "text-muted-foreground/70"
                      }`}
                    />
                    <span
                      className={
                        t.highlight
                          ? "font-medium text-foreground"
                          : "text-muted-foreground"
                      }
                    >
                      {t.label}
                    </span>
                  </motion.li>
                );
              })}
            </ol>
          </div>
        </div>

        {/* AI Insight */}
        <div className="px-5 pt-3">
          <div className="relative overflow-hidden rounded-xl border border-accent/15 bg-accent/[0.06] p-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg ring-aurora text-white">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">
                  AI Insight
                </p>
                <p className="mt-1 text-xs leading-relaxed text-foreground/90">
                  You&rsquo;re strongest in{" "}
                  <span className="font-medium text-foreground">Backend Development</span>.
                  Focus on{" "}
                  <span className="font-medium text-foreground">System Design</span> to
                  improve your interview readiness.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Interview */}
        <div className="px-5 py-4">
          <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.015] p-3.5">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/12 text-primary">
                <Briefcase className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-semibold text-foreground">
                  Google — SDE Intern
                </p>
                <p className="text-[11px] text-muted-foreground">
                  May 26 · 10:30 AM
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-accent transition-colors hover:text-accent/80">
              Prepare now
              <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default HeroDashboard;