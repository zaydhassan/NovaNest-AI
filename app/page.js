"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  MessagesSquare,
  Workflow,
  Infinity,
  Brain,
  History,
  Fingerprint,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import HeroSection from "@/components/site/hero";
import WhyNovaNest from "@/components/site/why-novanest";
import { ProductDemo } from "@/components/site/product-demo";
import { DashboardPreview } from "@/components/site/dashboard-preview";
import { Pricing } from "@/components/site/pricing";
import { SectionHeading } from "@/components/site/section-heading";
import { SpotlightCard } from "@/components/site/spotlight-card";
import { RevealStagger, RevealItem } from "@/components/site/reveal";
import { features } from "@/data/features";
import { faqs } from "@/data/faqs";
import { howItWorks } from "@/data/howItWorks";
import { plans } from "@/data/pricing";
import { aiFeatures } from "@/data/aiFeatures";

const ease = [0.22, 1, 0.36, 1];

const accentText = {
  cyan: "text-accent",
  purple: "text-primary",
  emerald: "text-accent-warm",
};

export default function LandingPage() {
  return (
    <>
      <HeroSection />

      {/* ---- Why not just ChatGPT? ---- */}
      <section className="relative border-y border-white/[0.06] bg-white/[0.015] py-16 md:py-24">
        <div className="container mx-auto px-4">
          <SectionHeading
            eyebrow="Why not just ChatGPT"
            title="A chatbot starts from zero. NovaNest starts from you."
            subtitle="ChatGPT is a blank slate every time. NovaNest is an operating system — it remembers, coordinates, and compounds."
          />
          <RevealStagger className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
            <RevealItem>
              <SpotlightCard className="glass h-full rounded-2xl p-6 transition-all duration-300 ease-spring hover:-translate-y-1.5 hover:border-white/20">
                <div className="mb-5 grid h-12 w-12 place-items-center rounded-xl ring-aurora text-white shadow-glow">
                  <MessagesSquare className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">ChatGPT starts from zero.</h3>
                <p className="text-sm text-muted-foreground">
                  NovaNest starts from <em>you</em>. A persistent memory carries your roles, skills, goals, and every mock you&apos;ve run — so every answer is sharper than the last.
                </p>
              </SpotlightCard>
            </RevealItem>
            <RevealItem>
              <SpotlightCard className="glass h-full rounded-2xl p-6 transition-all duration-300 ease-spring hover:-translate-y-1.5 hover:border-white/20">
                <div className="mb-5 grid h-12 w-12 place-items-center rounded-xl ring-aurora text-white shadow-glow">
                  <Workflow className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">A chatbot guesses.</h3>
                <p className="text-sm text-muted-foreground">
                  NovaNest <em>coordinates</em>. A router picks the right specialist — interview, resume, application, analytics, learning — instead of one prompt doing everything badly.
                </p>
              </SpotlightCard>
            </RevealItem>
            <RevealItem>
              <SpotlightCard className="glass h-full rounded-2xl p-6 transition-all duration-300 ease-spring hover:-translate-y-1.5 hover:border-white/20">
                <div className="mb-5 grid h-12 w-12 place-items-center rounded-xl ring-aurora text-white shadow-glow">
                  <Infinity className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">A tool you outgrow.</h3>
                <p className="text-sm text-muted-foreground">
                  NovaNest <em>compounds</em>. Your Career Twin, timeline, and health score get richer with every action — so the guidance compounds with every step.
                </p>
              </SpotlightCard>
            </RevealItem>
          </RevealStagger>
        </div>
      </section>

      {/* ---- Pillars ---- */}
      <section id="features" className="section">
        <div className="container mx-auto px-4">
          <SectionHeading
            eyebrow="The system"
            title="Six pillars. One operating system."
            subtitle="Every pillar feeds the next — your work doesn't sit in silos, it compounds."
          />
          <RevealStagger className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <RevealItem key={index}>
                <SpotlightCard className="glass group h-full rounded-2xl p-6 transition-all duration-300 ease-spring hover:-translate-y-1.5 hover:border-white/20 hover:shadow-glass-lg">
                  <div className="mb-5 grid h-12 w-12 place-items-center rounded-xl ring-aurora text-white shadow-glow transition-transform duration-300 ease-spring group-hover:scale-110 group-hover:rotate-3">
                    {feature.icon}
                  </div>
                  <h3 className="mb-1.5 text-lg font-semibold">{feature.title}</h3>
                  {feature.value && (
                    <p className="mb-2 text-sm font-medium text-foreground/90">{feature.value}</p>
                  )}
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </SpotlightCard>
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </section>

      {/* ---- Interactive product demo ---- */}
      <section id="demo" className="section pt-4 md:pt-8">
        <div className="container mx-auto px-4">
          <SectionHeading
            eyebrow="See it in action"
            title="One workspace, every career tool"
            subtitle="Switch between the core products and watch them work — no signup required."
          />
          <ProductDemo />
        </div>
      </section>

      {/* ---- Dashboard preview ---- */}
      <section className="section pt-4 md:pt-8">
        <div className="container mx-auto px-4">
          <SectionHeading
            eyebrow="Dashboard"
            title="An executive view of your career"
            subtitle="KPIs, salary analytics, skill coverage, and AI-curated trends — all in one calm, focused workspace."
          />
          <DashboardPreview />
        </div>
      </section>

      {/* ---- How NovaNest compounds ---- */}
      <section className="section py-12 md:py-20">
        <div className="container mx-auto px-4">
          <SectionHeading
            eyebrow="Why it compounds"
            title="Every action makes the next one sharper"
            subtitle="NovaNest isn't a tool you run and forget. It's a system that gets richer the more you use it."
          />
          <RevealStagger className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
            <RevealItem>
              <SpotlightCard className="glass group h-full rounded-2xl p-6 transition-all duration-300 ease-spring hover:-translate-y-1.5 hover:border-white/20">
                <div className="mb-5 grid h-12 w-12 place-items-center rounded-xl ring-aurora text-white shadow-glow transition-transform duration-300 ease-spring group-hover:scale-110">
                  <Brain className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">Every action writes to memory</h3>
                <p className="text-sm text-muted-foreground">
                  Chat, mock, resume, and application — each one extracts durable facts that the OS recalls next time.
                </p>
              </SpotlightCard>
            </RevealItem>
            <RevealItem>
              <SpotlightCard className="glass group h-full rounded-2xl p-6 transition-all duration-300 ease-spring hover:-translate-y-1.5 hover:border-white/20">
                <div className="mb-5 grid h-12 w-12 place-items-center rounded-xl ring-aurora text-white shadow-glow transition-transform duration-300 ease-spring group-hover:scale-110">
                  <History className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">A timeline builds itself</h3>
                <p className="text-sm text-muted-foreground">
                  Your career history auto-derives from your activity — no manual journaling, no separate log to maintain.
                </p>
              </SpotlightCard>
            </RevealItem>
            <RevealItem>
              <SpotlightCard className="glass group h-full rounded-2xl p-6 transition-all duration-300 ease-spring hover:-translate-y-1.5 hover:border-white/20">
                <div className="mb-5 grid h-12 w-12 place-items-center rounded-xl ring-aurora text-white shadow-glow transition-transform duration-300 ease-spring group-hover:scale-110">
                  <Fingerprint className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">A Career Twin gets sharper</h3>
                <p className="text-sm text-muted-foreground">
                  An AI model of you rebuilds from your latest history — so the voice answering questions is always current.
                </p>
              </SpotlightCard>
            </RevealItem>
          </RevealStagger>
        </div>
      </section>

      {/* ---- AI features ---- */}
      <section className="section py-12 md:py-20">
        <div className="container mx-auto px-4">
          <SectionHeading
            eyebrow="Intelligence layer"
            title="Intelligence woven into every step"
            subtitle="The OS layer that turns your activity into memory, scores, and guidance — contextual, private, and built for the work you actually do."
          />
          <RevealStagger className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {aiFeatures.map((f) => {
              const Icon = f.icon;
              return (
                <RevealItem key={f.title}>
                  <SpotlightCard className="glass group relative h-full overflow-hidden rounded-2xl p-6 transition-all duration-300 ease-spring hover:-translate-y-1.5 hover:border-white/20">
                    <div
                      className="absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-40"
                      style={{ background: `hsl(var(--${f.accent}))` }}
                      aria-hidden="true"
                    />
                    <div className="mb-5 grid h-12 w-12 place-items-center rounded-xl border border-white/10 bg-white/[0.04] transition-transform duration-300 ease-spring group-hover:scale-110">
                      <Icon className={`h-6 w-6 ${accentText[f.accent]}`} />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold">{f.title}</h3>
                    <p className="text-sm text-muted-foreground">{f.description}</p>
                  </SpotlightCard>
                </RevealItem>
              );
            })}
          </RevealStagger>
        </div>
      </section>

      {/* ---- How it works ---- */}
      <section className="section">
        <div className="container mx-auto px-4">
          <SectionHeading
            eyebrow="How it works"
            title="Set up once. It remembers forever."
            subtitle="Every action you take writes to memory — so the system gets richer, and the guidance gets sharper, with every step."
          />
          <div className="relative mx-auto max-w-6xl">
            <div className="hidden md:absolute md:left-0 md:right-0 md:top-[64px] md:block" aria-hidden="true">
              <div className="mx-auto h-px max-w-5xl bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            </div>
            <RevealStagger className="grid grid-cols-1 gap-8 md:grid-cols-4" stagger={0.1}>
              {howItWorks.map((item, i) => (
                <RevealItem key={i} className="relative">
                  <SpotlightCard className="glass h-full rounded-2xl p-6 transition-all duration-300 ease-spring hover:-translate-y-1.5 hover:border-white/20">
                    <div className="mb-4 grid h-10 w-10 place-items-center rounded-full ring-aurora font-semibold text-white shadow-glow">
                      {i + 1}
                    </div>
                    <div className="mb-4 text-primary">{item.icon}</div>
                    <h3 className="mb-2 text-base font-semibold">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </SpotlightCard>
                </RevealItem>
              ))}
            </RevealStagger>
          </div>
        </div>
      </section>

      {/* ---- Why NovaNest ---- */}
      <WhyNovaNest />

      {/* ---- Pricing ---- */}
      <section id="pricing" className="section scroll-mt-24">
        <div className="container mx-auto px-4">
          <SectionHeading
            eyebrow="Pricing"
            title="Start free. Scale to the full OS."
            subtitle="Begin on the free plan. Upgrade to the full operating system when you're ready. Cancel anytime."
          />
          <Pricing plans={plans} />
        </div>
      </section>

      {/* ---- FAQ ---- */}
      <section className="section">
        <div className="container mx-auto px-4">
          <SectionHeading
            eyebrow="FAQ"
            title="Frequently asked questions"
            subtitle="What people ask before running their career on NovaNest."
          />
          <div className="mx-auto max-w-3xl space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ delay: i * 0.06, duration: 0.4, ease }}
                className="glass overflow-hidden rounded-xl transition-colors hover:border-white/15"
              >
                <Accordion type="single" collapsible>
                  <AccordionItem value={`faq-${i}`} className="border-0">
                    <AccordionTrigger className="px-5 py-4 text-left text-sm font-medium hover:no-underline [&>svg]:hidden">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="px-5 pb-5 text-sm text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Final CTA ---- */}
      <section className="section">
        <div className="container mx-auto px-4">
          <div className="border-gradient relative overflow-hidden px-6 py-16 text-center shadow-glass-lg md:py-20">
            <div
              className="aurora-blob"
              style={{ width: 420, height: 420, top: -140, left: "20%", background: "hsl(var(--purple))", opacity: 0.25 }}
              aria-hidden="true"
            />
            <div
              className="aurora-blob"
              style={{ width: 360, height: 360, bottom: -160, right: "18%", background: "hsl(var(--cyan))", opacity: 0.2 }}
              aria-hidden="true"
            />
            <div className="relative z-10 mx-auto max-w-2xl">
              <h2 className="aurora-text animate-aurora text-3xl font-extrabold md:text-5xl">
                Run your career on AI.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground md:text-lg">
                Stop starting from zero. NovaNest remembers your career,
                coordinates the work, and compounds with every step.
              </p>
              <Link href="/dashboard" className="mt-8 inline-block">
                <Button variant="gradient" size="lg" className="gap-2 rounded-full px-8">
                  Start free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}