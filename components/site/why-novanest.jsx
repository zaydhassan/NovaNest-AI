"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Brain,
  Workflow,
  Fingerprint,
  History,
  LayoutDashboard,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const ease = [0.22, 1, 0.36, 1];

/**
 * WhyNovaNest — premium value-proposition section.
 *
 * Replaces the generic testimonial grid. Communicates what makes NovaNest
 * different through six interactive feature cards on an obsidian backdrop:
 * soft grid, faint radial spotlight, very subtle animated aurora, cursor-
 * following glow, animated gradient borders, and spring-based hover lifts.
 *
 * Design rules respected (Obsidian system):
 *  - Section heading stays SOLID text-foreground (no aurora-text — that is
 *    reserved for the hero + final CTA only).
 *  - The reserved cyan→purple→emerald gradient appears only on icon rings,
 *    borders, glows, and the CTA — exactly the sanctioned surfaces.
 *  - Surfaces are near-black glass with hairline white borders.
 */
const features = [
  {
    icon: Brain,
    title: "Remembers your whole career",
    description:
      "Not session state — durable memory that recalls your roles, mocks, and goals across every conversation, so every answer starts from you.",
    accent: "purple",
  },
  {
    icon: Workflow,
    title: "Coordinates specialist agents",
    description:
      "An intent router dispatches the right agent — interview, resume, application, analytics, learning — instead of one bloated prompt doing everything badly.",
    accent: "cyan",
  },
  {
    icon: Fingerprint,
    title: "A Career Twin that talks like you",
    description:
      "An AI model of you, rebuilt from your history, that answers questions in your voice and surfaces what you'd say in the room.",
    accent: "emerald",
  },
  {
    icon: History,
    title: "A timeline that builds itself",
    description:
      "Every action auto-derives a career timeline — no manual journaling, no separate log. Your history writes itself as you work.",
    accent: "cyan",
  },
  {
    icon: LayoutDashboard,
    title: "One workspace, not five tabs",
    description:
      "Resume, applications, interviews, insights, and learning — connected, not copy-pasted between disconnected tools.",
    accent: "purple",
  },
  {
    icon: ShieldCheck,
    title: "Private by default",
    description:
      "Encrypted at rest, scoped to your account, and never used to train shared models. Your career stays yours.",
    accent: "emerald",
  },
];

/**
 * FeatureCard — the interactive unit.
 * Mouse-follow glow is driven by CSS vars (--mx/--my) set via a rAF-throttled
 * pointer handler, mirroring the hero's spotlight technique so it stays 60fps.
 */
function FeatureCard({ feature, index }) {
  const cardRef = useRef(null);
  const rafRef = useRef(null);

  const handleMouseMove = (e) => {
    const el = cardRef.current;
    if (!el) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
      el.style.setProperty("--my", `${e.clientY - rect.top}px`);
    });
  };

  const Icon = feature.icon;
  const glowVar = `var(--${feature.accent})`;

  return (
    <motion.article
      ref={cardRef}
      onMouseMove={handleMouseMove}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay: index * 0.1, ease }}
      whileHover={{ y: -6, scale: 1.02 }}
      style={{ "--glow": glowVar, willChange: "transform" }}
      className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 backdrop-blur-xl transition-[box-shadow,border-color] duration-500 hover:border-white/[0.14] hover:shadow-glass-lg"
    >
      {/* Cursor-following radial glow */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(280px circle at var(--mx, 50%) var(--my, 50%), hsl(var(--glow) / 0.16), transparent 62%)",
        }}
      />

      {/* Ambient corner blur, lit on hover */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-30"
        style={{ background: `hsl(${glowVar})` }}
      />

      {/* Animated gradient border — fades + pans in on hover */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          padding: "1px",
          background:
            "linear-gradient(130deg, hsl(var(--cyan) / 0.7), hsl(var(--purple) / 0.45), hsl(var(--emerald) / 0.55))",
          backgroundSize: "220% 220%",
          WebkitMask:
            "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          animation: "gradient-pan 6s ease infinite",
        }}
      />

      {/* Very subtle floating particles */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-7 top-10 h-1 w-1 rounded-full bg-white/25"
        style={{ animation: "floaty 7s ease-in-out infinite" }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-10 top-16 h-[3px] w-[3px] rounded-full bg-white/15"
        style={{ animation: "floaty 9s ease-in-out infinite reverse" }}
      />

      <div className="relative z-10">
        {/* Gradient icon with spring micro-rotation on hover */}
        <div className="mb-5 grid h-12 w-12 place-items-center rounded-xl ring-aurora text-white shadow-glow transition-transform duration-500 ease-spring group-hover:-rotate-6 group-hover:scale-110">
          <Icon className="h-6 w-6" />
        </div>

        <h3 className="text-lg font-semibold tracking-tight text-foreground">
          {feature.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {feature.description}
        </p>

        {/* Small accent line — lengthens on hover */}
        <span
          aria-hidden="true"
          className="mt-5 block h-px w-8 origin-left scale-x-100 bg-gradient-to-r from-transparent via-white/40 to-transparent transition-all duration-500 ease-spring group-hover:w-16"
        />
      </div>
    </motion.article>
  );
}

export default function WhyNovaNest() {
  return (
    <section
      id="why-novanest"
      className="relative overflow-hidden px-4 py-24 md:py-32"
    >
      {/* Soft grid mesh */}
      <div
        className="grid-mesh pointer-events-none absolute inset-0 opacity-60"
        aria-hidden="true"
      />
      {/* Faint radial spotlight from the top */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, hsl(var(--purple) / 0.10), transparent 70%)",
        }}
      />
      {/* Very subtle animated aurora */}
      <div
        className="aurora-blob pointer-events-none"
        aria-hidden="true"
        style={{
          width: 360,
          height: 360,
          top: "8%",
          left: "58%",
          background: "hsl(var(--cyan))",
          opacity: 0.06,
          animation: "floaty 14s ease-in-out infinite",
        }}
      />
      <div
        className="aurora-blob pointer-events-none"
        aria-hidden="true"
        style={{
          width: 320,
          height: 320,
          bottom: "6%",
          left: "8%",
          background: "hsl(var(--purple))",
          opacity: 0.06,
          animation: "floaty 16s ease-in-out infinite reverse",
        }}
      />

      <div className="container relative mx-auto">
        {/* Heading block */}
        <div className="mx-auto max-w-3xl text-center">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.5, ease }}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground backdrop-blur"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Why NovaNest
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6, delay: 0.06, ease }}
            className="mt-6 text-3xl font-extrabold tracking-tight text-foreground md:text-5xl lg:text-[3.4rem] lg:leading-[1.05]"
          >
            What makes it an operating system
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6, delay: 0.12, ease }}
            className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground md:text-lg"
          >
            NovaNest isn&apos;t a resume builder with a chatbot bolted on. It&apos;s
            one connected career OS where every document, practice session, and
            insight is shaped by your goals — so the guidance compounds with
            every step you take.
          </motion.p>
        </div>

        {/* Feature grid — 3×2 desktop, 2×3 tablet, 1 column mobile */}
        <div className="mx-auto mt-16 grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, delay: 0.1, ease }}
          className="mx-auto mt-20 max-w-2xl text-center"
        >
          <h3 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Run your career on AI.
          </h3>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground md:text-lg">
            Stop starting from zero. NovaNest remembers your career, coordinates
            the work, and compounds with every step.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/dashboard">
              <Button variant="gradient" size="lg" className="w-full gap-2 rounded-full px-7 sm:w-auto">
                Start free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="#demo">
              <Button size="lg" variant="outline" className="w-full rounded-full px-7 sm:w-auto">
                See the OS
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}