"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Sparkles, LayoutGrid, GraduationCap, KanbanSquare, Radar } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1];

const ITEMS = [
  {
    icon: Sparkles,
    title: "AI Career Copilot",
    subtitle: "Your always-on AI career coach.",
  },
  {
    icon: LayoutGrid,
    title: "Smart Workspace",
    subtitle: "Everything about your career in one place.",
  },
  {
    icon: GraduationCap,
    title: "Interview Prep",
    subtitle: "Practice with AI-powered feedback.",
  },
  {
    icon: KanbanSquare,
    title: "Application Tracker",
    subtitle: "Track applications and follow-ups.",
  },
  {
    icon: Radar,
    title: "Career Intelligence",
    subtitle: "Data-driven insights for smarter decisions.",
  },
];

export function FeatureStrip() {
  const reduced = useReducedMotion();

  return (
    <section className="relative border-y border-white/[0.05] bg-white/[0.012] py-10 md:py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] sm:grid-cols-3 lg:grid-cols-5">
          {ITEMS.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={reduced ? false : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.5, ease: EASE }}
                className="group relative bg-card/40 p-5 transition-colors duration-300 hover:bg-white/[0.03]"
              >
                <div className="mb-3 inline-grid h-9 w-9 place-items-center rounded-lg border border-white/[0.07] bg-white/[0.02] text-accent transition-all duration-300 ease-spring group-hover:border-accent/30 group-hover:text-accent">
                  <Icon className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {item.subtitle}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default FeatureStrip;