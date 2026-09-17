"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Zap,
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
import SixPillars from "@/components/site/six-pillars";
import { FeatureStrip } from "@/components/site/feature-strip";
import WhyNovaNest from "@/components/site/why-novanest";
import { ProductDemo } from "@/components/site/product-demo";
import { DashboardPreview } from "@/components/site/dashboard-preview";
import { IntelligenceSection } from "@/components/site/intelligence/intelligence-section";
import { HowItWorks } from "@/components/site/how-it-works";
import { Pricing } from "@/components/site/pricing";
import { SectionHeading } from "@/components/site/section-heading";
import { SpotlightCard } from "@/components/site/spotlight-card";
import { RevealStagger, RevealItem } from "@/components/site/reveal";
import { faqs } from "@/data/faqs";
import { plans } from "@/data/pricing";

const ease = [0.22, 1, 0.36, 1];

export default function LandingPage() {
  return (
    <>
      <HeroSection />

      <FeatureStrip />

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

      <SixPillars />

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

      <IntelligenceSection />

      <HowItWorks />

      <WhyNovaNest />

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

      <section className="section relative overflow-hidden bg-[#030305]">
        {/* Radial atmosphere: subtle violet left, deep pink right, dark center */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(640px circle at 6% 42%, hsl(263 74% 40% / 0.11), transparent 70%), radial-gradient(640px circle at 94% 58%, hsl(345 60% 36% / 0.09), transparent 70%)",
          }}
        />
        {/* Technical grid: thin 1px lines, low opacity, fades into the dark */}
        <div
          aria-hidden="true"
          className="grid-mesh pointer-events-none absolute inset-0"
          style={{ backgroundSize: "120px 120px" }}
        />
        <div className="relative z-10 mx-auto w-[calc(100%-40px)] max-w-[1740px]">
          {/* Orbital curves: one entering from the left, one from the right */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-[40px] -top-[80px] h-[520px] w-[520px] rounded-tl-full border-l border-t border-[hsl(263_74%_58%/0.22)]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-[48px] -bottom-[26px] h-[560px] w-[560px] rounded-br-full border-b border-r border-[hsl(328_82%_52%/0.2)]"
          />
          <div className="relative flex min-h-[400px] flex-col items-center justify-center overflow-hidden rounded-[24px] border border-white/[0.18] bg-[#111217] px-6 py-[52px] text-center md:rounded-[28px] md:px-16 md:py-[64px]">
            {/* Internal radial lighting: violet left, magenta right, dark center */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -left-24 top-1/2 h-[460px] w-[460px] -translate-y-1/2 rounded-full opacity-60 blur-[110px]"
              style={{ background: "hsl(263 74% 58% / 0.18)" }}
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-24 top-1/2 h-[400px] w-[400px] -translate-y-1/2 rounded-full opacity-60 blur-[110px]"
              style={{ background: "hsl(345 70% 45% / 0.15)" }}
            />
            <h2 className="relative text-[36px] font-bold leading-[1.05] tracking-tight text-[#F5F5F7] md:text-[44px] lg:text-[56px]">
              Run your career on{" "}
              <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                AI.
              </span>
            </h2>
            <p className="relative mx-auto mt-4 max-w-[720px] text-[16px] leading-[1.55] text-[#9296A3] md:text-[18px]">
              Stop starting from zero. NovaNest remembers your career,
              coordinates the work, and compounds with every step.
            </p>
            <Link
              href="/dashboard"
              className="group relative mt-[30px] inline-block rounded-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111217]"
            >
              <Button
                asChild
                variant="ghost"
                className="flex h-[52px] w-[170px] cursor-pointer items-center justify-center gap-2 rounded-[15px] border border-white/[0.25] bg-[#F7F7F8] text-[15px] font-semibold text-[#111114] shadow-[0_10px_30px_rgba(0,0,0,0.28)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white hover:text-[#111114] hover:shadow-[0_14px_34px_rgba(0,0,0,0.34)] active:scale-[0.98] md:h-[54px] md:w-[180px] [&_svg]:size-auto"
              >
                <span>
                  <Sparkles size={15} strokeWidth={1.8} aria-hidden="true" />
                  Start for free
                  <ArrowRight
                    size={17}
                    className="ml-0.5 transition-transform duration-200 ease-out motion-safe:group-hover/btn:translate-x-1"
                    aria-hidden="true"
                  />
                </span>
              </Button>
            </Link>
            <div className="relative mt-[22px] flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px] text-[#777B88]">
              <span className="inline-flex items-center gap-1.5">
                <Zap size={13} className="text-accent" aria-hidden="true" />
                No credit card
              </span>
              <span aria-hidden="true" className="hidden h-3 w-px bg-white/15 sm:block" />
              <span className="inline-flex items-center gap-1.5">
                <Infinity size={13} className="text-primary" aria-hidden="true" />
                Free forever
              </span>
              <span aria-hidden="true" className="hidden h-3 w-px bg-white/15 sm:block" />
              <span className="inline-flex items-center gap-1.5">
                <Fingerprint size={13} className="text-accent" aria-hidden="true" />
                Your data stays yours
              </span>
            </div>
          </div>
          {/* Tiny glowing nodes along the orbital curves */}
          <div
            aria-hidden="true"
            className="absolute left-[6%] top-[72px] h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_10px_2px_hsl(var(--accent)/0.55)]"
          />
          <div
            aria-hidden="true"
            className="absolute right-[6%] top-[64px] h-1 w-1 rounded-full bg-primary shadow-[0_0_10px_2px_hsl(var(--primary)/0.5)]"
          />
          <div
            aria-hidden="true"
            className="absolute left-[93%] top-[262px] h-1 w-1 rounded-full bg-accent shadow-[0_0_10px_2px_hsl(var(--accent)/0.45)]"
          />
        </div>
      </section>
    </>
  );
}