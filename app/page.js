"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Trophy,
  Target,
  Sparkles,
  CheckCircle2,
  Quote,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import HeroSection from "@/components/site/hero";
import { SectionHeading } from "@/components/site/section-heading";
import { StatCounter } from "@/components/site/stat-counter";
import { features } from "@/data/features";
import { testimonial } from "@/data/testimonial";
import { faqs } from "@/data/faqs";
import { howItWorks } from "@/data/howItWorks";

const stats = [
  { icon: <Trophy className="h-5 w-5" />, to: 50, suffix: "+", label: "Industries covered", delay: 0, accent: "linear-gradient(135deg,hsl(var(--chart-1)),hsl(var(--chart-2)))" },
  { icon: <Sparkles className="h-5 w-5" />, to: 1000, suffix: "+", label: "AI interview questions", delay: 120, accent: "linear-gradient(135deg,hsl(var(--chart-3)),hsl(var(--chart-1)))" },
  { icon: <CheckCircle2 className="h-5 w-5" />, to: 95, suffix: "%", label: "User success rate", delay: 240, accent: "linear-gradient(135deg,hsl(var(--chart-4)),hsl(var(--chart-2)))" },
  { icon: <Target className="h-5 w-5" />, to: 24, suffix: "/7", label: "AI support", delay: 360, accent: "linear-gradient(135deg,hsl(var(--chart-2)),hsl(var(--chart-1)))" },
];

export default function LandingPage() {
  return (
    <>
      <HeroSection />

      {/* Trust strip */}
      <section className="border-y border-border/40 bg-background/30 py-8">
        <div className="container mx-auto px-4">
          <p className="mb-6 text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Trusted by professionals at
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-70">
            {["TechNova", "BrightWave", "Insight Co.", "Northwind", "Lumen", "Vertex"].map((name) => (
              <span key={name} className="font-display text-lg font-semibold text-muted-foreground">
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section">
        <div className="container mx-auto px-4">
          <SectionHeading
            eyebrow="Features"
            title="Everything you need to grow your career"
            subtitle="A complete AI toolkit — from your first resume to your next promotion."
          />
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="glass group rounded-2xl p-6 transition-transform duration-300 hover:-translate-y-1.5"
              >
                <div className="mb-5 grid h-12 w-12 place-items-center rounded-xl ring-aurora text-white">
                  {feature.icon}
                </div>
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="section py-12 md:py-20">
        <div className="container mx-auto px-4">
          <SectionHeading
            eyebrow="By the numbers"
            title="Measurable impact for real careers"
            subtitle="Real outcomes from professionals using NovaNest to accelerate their search."
          />
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
            {stats.map((s) => (
              <StatCounter key={s.label} {...s} />
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section">
        <div className="container mx-auto px-4">
          <SectionHeading
            eyebrow="How it works"
            title="Four steps to a stronger career"
            subtitle="Fast, clear, and effective — from setup to success."
          />
          <div className="relative mx-auto max-w-6xl">
            <div className="hidden md:absolute md:left-0 md:right-0 md:top-[64px] md:block" aria-hidden="true">
              <div className="mx-auto h-px max-w-5xl bg-gradient-to-r from-transparent via-border to-transparent" />
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
              {howItWorks.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="relative"
                >
                  <div className="glass rounded-2xl p-6">
                    <div className="mb-4 grid h-10 w-10 place-items-center rounded-full ring-aurora font-semibold text-white">
                      {i + 1}
                    </div>
                    <div className="mb-4 text-primary">{item.icon}</div>
                    <h3 className="mb-2 text-base font-semibold">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section">
        <div className="container mx-auto px-4">
          <SectionHeading
            eyebrow="NovaNest stories"
            title="Loved by ambitious professionals"
            subtitle="Real results from people using NovaNest to accelerate their careers."
          />
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-3">
            {testimonial.map((item, idx) => (
              <motion.figure
                key={item.author}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="glass relative rounded-2xl p-6"
              >
                <Quote className="absolute right-5 top-5 h-8 w-8 text-primary/20" aria-hidden="true" />
                <div className="mb-4 flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image}
                    alt={item.author}
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-full object-cover ring-2 ring-primary/30"
                  />
                  <div>
                    <figcaption className="text-sm font-semibold">{item.author}</figcaption>
                    <p className="text-xs text-muted-foreground">
                      {item.role} · {item.company}
                    </p>
                  </div>
                </div>
                <div className="mb-3 flex gap-0.5 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
                <blockquote className="text-sm leading-relaxed text-foreground/90">
                  {item.quote}
                </blockquote>
              </motion.figure>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section">
        <div className="container mx-auto px-4">
          <SectionHeading
            eyebrow="FAQ"
            title="Frequently asked questions"
            subtitle="Clear answers to help you get started with confidence."
          />
          <div className="mx-auto max-w-3xl space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
                className="glass overflow-hidden rounded-xl"
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

      {/* Final CTA */}
      <section className="section">
        <div className="container mx-auto px-4">
          <div className="glass-strong relative overflow-hidden rounded-3xl px-6 py-16 text-center md:py-20">
            <div className="aurora-blob" style={{ width: 400, height: 400, top: -120, left: "20%", background: "hsl(var(--primary))" }} aria-hidden="true" />
            <div className="relative z-10 mx-auto max-w-2xl">
              <h2 className="aurora-text animate-aurora text-3xl font-extrabold md:text-5xl">
                Ready to advance your career?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground md:text-lg">
                Join a new wave of professionals scaling new heights with NovaNest&apos;s smart tools, insights, and interview mastery.
              </p>
              <Link href="/dashboard" className="mt-8 inline-block">
                <Button size="lg" className="gap-2 rounded-full px-8 shadow-glow">
                  Begin your career upgrade
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