"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Target, RefreshCw, ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Reveal } from "@/components/site/reveal";
import { SpotlightCard } from "@/components/site/spotlight-card";
import { cn } from "@/lib/utils";
import useFetch from "@/hooks/use-fetch";
import {
  setTargetCompany,
  clearTargetCompany,
  regenerateDreamCompanyPlan,
} from "@/actions/dream-company";
import {
  InterviewSection,
  LearningSection,
  ProjectsSection,
  ResumeSection,
  SkillGapSection,
  SalarySection,
  StrategySection,
} from "./sections";

const TABS = [
  { key: "interview", label: "Interview", icon: Target },
  { key: "learning", label: "Learning", icon: Sparkles },
  { key: "projects", label: "Projects", icon: Sparkles },
  { key: "resume", label: "Resume", icon: Sparkles },
  { key: "skill-gap", label: "Skill gap", icon: Sparkles },
  { key: "salary", label: "Salary", icon: Sparkles },
  { key: "strategy", label: "Strategy", icon: Sparkles },
];

export default function DreamCompanyView({ companies, selected, dashboard }) {
  const selectFetch = useFetch(setTargetCompany);
  const clearFetch = useFetch(clearTargetCompany);
  const regenFetch = useFetch(regenerateDreamCompanyPlan);
  const router = useRouter();

  const [tab, setTab] = useState("interview");

  const handlePick = async (slug) => {
    const res = await selectFetch.fn(slug);
    if (res) toast.success(`Targeting ${res.name}. Building your plan…`);
  };

  const handleClear = async () => {
    const res = await clearFetch.fn();
    if (res) toast.message("Cleared your dream company.");
  };

  const handleRegen = async () => {
    const res = await regenFetch.fn();
    if (res) toast.success("Plan regenerated.");
  };

  if (selected && !dashboard?.company) {
    const name = companies.find((c) => c.slug === selected)?.name ?? selected;
    return (
      <Card className="glass">
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary">
            <Target className="h-6 w-6" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-foreground">Targeting {name}</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              We couldn&rsquo;t build your personalized dashboard right now — the
              AI service is temporarily unavailable. Your target is saved, so
              just try again in a moment.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={() => router.refresh()} className="gap-2">
              <RefreshCw className="h-4 w-4" /> Try again
            </Button>
            <Button
              variant="outline"
              onClick={handleClear}
              disabled={clearFetch.loading}
              className="gap-2"
            >
              {clearFetch.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowLeft className="h-4 w-4" />}
              Switch company
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!selected) {
    const busy = selectFetch.loading;
    return (
      <div className="space-y-5">
        <p className="text-sm text-muted-foreground">
          Choose one of the eight companies below. Everything in NovaNest will
          then personalize to its hiring bar, values, and interview style — with
          the AI explaining why each recommendation is given.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {companies.map((c, i) => (
            <Reveal key={c.slug} delay={i * 0.05}>
              <SpotlightCard className="rounded-2xl">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handlePick(c.slug)}
                  className="group flex h-full w-full flex-col items-start gap-3 p-5 text-left"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
                    <Target className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-base font-semibold text-foreground">{c.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{c.tagline}</p>
                  </div>
                  <span className="mt-auto inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Target this company →"}
                  </span>
                </button>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      </div>
    );
  }

  const { company, profile, plan } = dashboard;
  const planData = plan?.plan && typeof plan.plan === "object" ? plan.plan : {};

  return (
    <div className="space-y-6">
      <Card className="glass">
        <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary">
              <Target className="h-6 w-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-foreground">{company.name}</h2>
                <Badge variant="secondary">{company.tagline}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Your recommendations are personalized to {company.name}'s hiring
                bar and values. Every item explains why.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleClear} disabled={clearFetch.loading} className="gap-2">
              <ArrowLeft className="h-3.5 w-3.5" /> Switch company
            </Button>
            <Button size="sm" onClick={handleRegen} disabled={regenFetch.loading} className="gap-2">
              {regenFetch.loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Regenerate plan
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex w-full flex-wrap justify-start gap-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <TabsTrigger key={t.key} value={t.key} className="gap-1.5">
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="interview" className="mt-4">
          <InterviewSection plan={planData} companyName={company.name} />
        </TabsContent>
        <TabsContent value="learning" className="mt-4">
          <LearningSection companyName={company.name} />
        </TabsContent>
        <TabsContent value="projects" className="mt-4">
          <ProjectsSection plan={planData} />
        </TabsContent>
        <TabsContent value="resume" className="mt-4">
          <ResumeSection plan={planData} companyName={company.name} />
        </TabsContent>
        <TabsContent value="skill-gap" className="mt-4">
          <SkillGapSection plan={planData} profile={profile} />
        </TabsContent>
        <TabsContent value="salary" className="mt-4">
          <SalarySection profile={profile} />
        </TabsContent>
        <TabsContent value="strategy" className="mt-4">
          <StrategySection plan={planData} companyName={company.name} />
        </TabsContent>
      </Tabs>
    </div>
  );
}