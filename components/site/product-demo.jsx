"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, GraduationCap, LineChart, Check, Sparkles, TrendingUp, Mic } from "lucide-react";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1];

const TABS = [
  { id: "resume", label: "Resume Builder", icon: FileText },
  { id: "interview", label: "Mock Interview", icon: GraduationCap },
  { id: "insights", label: "Industry Insights", icon: LineChart },
];

function ResumePreview() {
  return (
    <div className="grid gap-4 md:grid-cols-[1.3fr_1fr]">
      <div className="space-y-3">
        <div className="h-7 w-2/3 rounded-md bg-white/[0.06]" />
        <div className="h-3 w-1/2 rounded bg-white/[0.05]" />
        <div className="mt-5 h-4 w-1/3 rounded bg-white/[0.07]" />
        <div className="space-y-2 pt-1">
          {[0.95, 0.88, 0.92, 0.7].map((w, i) => (
            <motion.div
              key={i}
              className="h-3 rounded bg-white/[0.05]"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: `${w * 100}%`, opacity: 1 }}
              transition={{ delay: 0.1 + i * 0.08, duration: 0.5, ease }}
            />
          ))}
        </div>
        <div className="mt-5 h-4 w-1/3 rounded bg-white/[0.07]" />
        <div className="space-y-2 pt-1">
          {[0.8, 0.9, 0.6].map((w, i) => (
            <motion.div
              key={i}
              className="h-3 rounded bg-white/[0.05]"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: `${w * 100}%`, opacity: 1 }}
              transition={{ delay: 0.45 + i * 0.08, duration: 0.5, ease }}
            />
          ))}
        </div>
      </div>
      <div className="glass rounded-xl p-4">
        <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4 text-primary" /> AI suggestions
        </div>
        <ul className="space-y-2.5">
          {["Add a quantified impact metric", "Mention the stack: React, Node", "Tighten to one page"].map((s, i) => (
            <motion.li
              key={s}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="flex items-start gap-2 text-xs text-foreground/85"
            >
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-warm" /> {s}
            </motion.li>
          ))}
        </ul>
        <div className="mt-4 flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
          <span className="text-xs text-muted-foreground">ATS score</span>
          <span className="text-sm font-semibold text-accent-warm">94 / 100</span>
        </div>
      </div>
    </div>
  );
}

function InterviewPreview() {
  return (
    <div className="space-y-4">
      <div className="glass rounded-xl p-4">
        <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="h-2 w-2 animate-pulse rounded-full bg-accent-warm" /> AI Interviewer · Senior Backend
        </div>
        <p className="text-sm leading-relaxed text-foreground/90">
          “Walk me through how you&apos;d design a URL shortener that handles
          50k requests per second. Start with the API.”
        </p>
      </div>
      <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="grid h-10 w-10 place-items-center rounded-full ring-aurora">
          <Mic className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-end gap-1">
            {[0.4, 0.7, 0.5, 0.9, 0.6, 0.8, 0.45, 0.7, 0.55].map((h, i) => (
              <motion.span
                key={i}
                className="w-1 rounded-full bg-primary"
                animate={{ height: [`${h * 16}px`, `${h * 28}px`, `${h * 16}px`] }}
                transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.07, ease: "easeInOut" }}
              />
            ))}
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">Listening… speak naturally</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { k: "Clarity", v: 88 },
          { k: "Structure", v: 76 },
          { k: "Depth", v: 92 },
        ].map((m, i) => (
          <motion.div
            key={m.k}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.08 }}
            className="glass rounded-lg p-3 text-center"
          >
            <p className="text-lg font-bold text-foreground">{m.v}</p>
            <p className="text-[11px] text-muted-foreground">{m.k}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function InsightsPreview() {
  const bars = [62, 78, 54, 90, 70, 84];
  return (
    <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
      <div className="glass rounded-xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Demand by skill</p>
            <p className="text-base font-semibold">Software Engineering</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-accent-warm">
            <TrendingUp className="h-3 w-3" /> +12.4%
          </span>
        </div>
        <div className="flex h-32 items-end gap-3">
          {bars.map((h, i) => (
            <motion.div
              key={i}
              className="flex-1 rounded-t-md ring-aurora"
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ delay: i * 0.08, duration: 0.6, ease }}
            />
          ))}
        </div>
      </div>
      <div className="space-y-3">
        {[
          { k: "Median salary", v: "$148k" },
          { k: "Open roles", v: "12,400" },
          { k: "Top skill gap", v: "Rust" },
        ].map((s, i) => (
          <motion.div
            key={s.k}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.08 }}
            className="glass flex items-center justify-between rounded-lg p-4"
          >
            <span className="text-xs text-muted-foreground">{s.k}</span>
            <span className="text-sm font-semibold">{s.v}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/**
 * ProductDemo — interactive tabbed showcase. Lets visitors flip between the
 * three core products and watch an animated, self-running preview of each.
 */
export function ProductDemo() {
  const [active, setActive] = useState("resume");

  return (
    <div className="border-gradient mx-auto max-w-5xl shadow-glass-lg">
      <div className="rounded-[calc(var(--radius-2xl)-1px)] p-2">
        <div className="rounded-xl bg-background/40 p-4 md:p-6">
          {/* Tabs */}
          <div className="mb-5 flex flex-wrap gap-2">
            {TABS.map((t) => {
              const Icon = t.icon;
              const isActive = active === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActive(t.id)}
                  className={cn(
                    "relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    isActive ? "text-white" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="demo-tab-pill"
                      className="absolute inset-0 rounded-full cta-gradient opacity-90"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <Icon className="relative z-10 h-4 w-4" />
                  <span className="relative z-10">{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* Panel */}
          <div className="min-h-[300px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease }}
              >
                {active === "resume" && <ResumePreview />}
                {active === "interview" && <InterviewPreview />}
                {active === "insights" && <InsightsPreview />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDemo;