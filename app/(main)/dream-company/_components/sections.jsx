"use client";

import { useState, useEffect } from "react";
import {
  Target,
  Lightbulb,
  Hammer,
  FileText,
  Gauge,
  DollarSign,
  Route,
  Loader2,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SpotlightCard } from "@/components/site/spotlight-card";
import { Reveal } from "@/components/site/reveal";
import { cn } from "@/lib/utils";
import useFetch from "@/hooks/use-fetch";
import { recommendedTopics } from "@/actions/learning";
import dynamic from "next/dynamic";
import { scoreResumeForCompany, getCompanyApplications } from "@/actions/dream-company";
import { WhyNote } from "@/components/site/why-note";
import Link from "next/link";

const SalaryChart = dynamic(
  () => import("@/app/(main)/dashboard/_component/salary-chart"),
  {
    ssr: false,
    loading: () => <div className="h-[360px] shimmer rounded-2xl" />,
  }
);

const PRIORITY_META = {
  high: { label: "High", className: "bg-rose-500/15 text-rose-500" },
  med: { label: "Medium", className: "bg-amber-500/15 text-amber-500" },
  low: { label: "Low", className: "bg-emerald-500/15 text-emerald-500" },
};

function SectionEmpty({ children }) {
  return (
    <Card className="glass">
      <CardContent className="py-10 text-center text-sm text-muted-foreground">
        {children}
      </CardContent>
    </Card>
  );
}

export function InterviewSection({ plan, companyName }) {
  const questions = plan?.interviewQuestions || [];
  return (
    <div className="space-y-4">
      <Card className="glass">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" /> Interview questions for {companyName}
            </CardTitle>
            <CardDescription>
              Each question maps to a real {companyName} interview theme, with the why.
            </CardDescription>
          </div>
          <Button asChild size="sm" className="gap-2">
            <Link href="/interview/mock">
              <Sparkles className="h-3.5 w-3.5" /> Start a mock
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardHeader>
      </Card>
      {questions.length === 0 ? (
        <SectionEmpty>No interview questions yet — regenerate your plan.</SectionEmpty>
      ) : (
        <div className="grid gap-3">
          {questions.map((q, i) => (
            <Reveal key={i} delay={Math.min(i * 0.04, 0.3)}>
              <SpotlightCard className="rounded-2xl">
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/15 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{q.question}</p>
                      {q.theme && (
                        <Badge variant="secondary" className="mt-1.5">{q.theme}</Badge>
                      )}
                      <WhyNote>{q.why}</WhyNote>
                    </div>
                  </div>
                </div>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}

export function LearningSection({ companyName }) {
  const { data: topics, loading, fn } = useFetch(recommendedTopics);
  useEffect(() => {
    fn().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-accent" /> Learning roadmap for {companyName}
          </CardTitle>
          <CardDescription>
            Company-aware next skills — ranked from your target company's hiring bar, your
            industry, and mock-interview weaknesses.
          </CardDescription>
        </CardHeader>
      </Card>
      {loading ? (
        <Card className="glass">
          <CardContent className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading recommendations…
          </CardContent>
        </Card>
      ) : !topics?.length ? (
        <SectionEmpty>No recommendations right now — add a goal or run a mock interview.</SectionEmpty>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {topics.map((rec, i) => (
            <Reveal key={rec.skill} delay={Math.min(i * 0.04, 0.3)}>
              <SpotlightCard className="rounded-2xl">
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Lightbulb className="h-3.5 w-3.5 text-accent" /> {rec.skill}
                    </span>
                    <Badge variant="outline" className="tnum">Priority {rec.priority}</Badge>
                  </div>
                  <WhyNote>{rec.why}</WhyNote>
                </div>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}

export function ProjectsSection({ plan }) {
  const projects = plan?.recommendedProjects || [];
  return (
    <div className="space-y-4">
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hammer className="h-4 w-4 text-primary" /> Recommended projects
          </CardTitle>
          <CardDescription>
            Portfolio projects that would impress your target company specifically.
          </CardDescription>
        </CardHeader>
      </Card>
      {projects.length === 0 ? (
        <SectionEmpty>No project ideas yet — regenerate your plan.</SectionEmpty>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {projects.map((p, i) => (
            <Reveal key={i} delay={Math.min(i * 0.04, 0.3)}>
              <SpotlightCard className="rounded-2xl">
                <div className="p-4">
                  <p className="text-sm font-semibold text-foreground">{p.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{p.description}</p>
                  {p.skills?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {p.skills.map((s) => (
                        <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                      ))}
                    </div>
                  )}
                  <WhyNote>{p.why}</WhyNote>
                </div>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}

export function ResumeSection({ plan, companyName }) {
  const items = plan?.resumeOptimization || [];
  const { data: score, loading, fn } = useFetch(scoreResumeForCompany);
  const [shown, setShown] = useState(false);

  const handleScore = async () => {
    setShown(true);
    const res = await fn();
    if (!res) setShown(false);
  };

  return (
    <div className="space-y-4">
      <Card className="glass">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" /> Resume optimization for {companyName}
            </CardTitle>
            <CardDescription>
              Concrete edits weighted toward what {companyName} screeners look for.
            </CardDescription>
          </div>
          <Button size="sm" onClick={handleScore} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Gauge className="h-3.5 w-3.5" />}
            Score my resume
          </Button>
        </CardHeader>
      </Card>

      {items.length === 0 ? (
        <SectionEmpty>No resume suggestions yet — regenerate your plan.</SectionEmpty>
      ) : (
        <div className="grid gap-3">
          {items.map((it, i) => (
            <Reveal key={i} delay={Math.min(i * 0.04, 0.3)}>
              <SpotlightCard className="rounded-2xl">
                <div className="p-4">
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="shrink-0">{it.area}</Badge>
                    <p className="text-sm text-foreground">{it.suggestion}</p>
                  </div>
                  <WhyNote>{it.why}</WhyNote>
                </div>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      )}

      {shown && score && (
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-primary" /> Resume fit for {companyName}: {Math.round(Number(score.score ?? 0))}/100
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {score.strengths?.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-medium text-emerald-500">Strengths</p>
                <ul className="space-y-1">
                  {score.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" /> {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {score.gaps?.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-medium text-amber-500">Gaps</p>
                <ul className="space-y-1">
                  {score.gaps.map((s, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" /> {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {score.recommendations?.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-medium text-primary">Recommendations</p>
                <ul className="space-y-1">
                  {score.recommendations.map((s, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function SkillGapSection({ plan, profile }) {
  const gaps = plan?.skillGaps || [];

  const fallback = !gaps.length && profile
    ? Array.from(
        new Set([...(profile.topSkills || []), ...(profile.recommendedSkills || [])])
      )
        .slice(0, 8)
        .map((skill) => ({ skill, currentLevel: "Unknown", targetLevel: "Expected", why: `Listed by ${profile.displayName} as a key skill.`, priority: "med" }))
    : [];

  const list = gaps.length ? gaps : fallback;

  return (
    <div className="space-y-4">
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-primary" /> Skill gaps vs. {profile?.displayName || "your target"}
          </CardTitle>
          <CardDescription>
            Honest current → target levels, each with a priority and the why.
          </CardDescription>
        </CardHeader>
      </Card>
      {list.length === 0 ? (
        <SectionEmpty>No skill-gap data yet — set a target company and generate your plan.</SectionEmpty>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {list.map((g, i) => {
            const meta = PRIORITY_META[g.priority] || PRIORITY_META.med;
            return (
              <Reveal key={g.skill + i} delay={Math.min(i * 0.04, 0.3)}>
                <SpotlightCard className="rounded-2xl">
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-foreground">{g.skill}</span>
                      <Badge className={cn("text-[10px]", meta.className)}>{meta.label}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      <span className="text-foreground/70">{g.currentLevel}</span>
                      <ArrowRight className="mx-1 inline h-3 w-3" />
                      <span className="text-foreground">{g.targetLevel}</span>
                    </p>
                    <WhyNote>{g.why}</WhyNote>
                  </div>
                </SpotlightCard>
              </Reveal>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function SalarySection({ profile }) {
  const ranges = profile?.salaryRanges || [];
  if (!ranges.length) {
    return (
      <SectionEmpty>
        Salary data for {profile?.displayName || "this company"} isn't ready yet — it refreshes weekly.
      </SectionEmpty>
    );
  }
  return (
    <div className="space-y-4">
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" /> Salary ranges at {profile.displayName}
          </CardTitle>
          <CardDescription>
            Representative US levels bands (rule-based, not AI-generated).
          </CardDescription>
        </CardHeader>
      </Card>
      <SalaryChart salaryRanges={ranges} />
    </div>
  );
}

export function StrategySection({ plan, companyName }) {
  const steps = plan?.applicationStrategy || [];

  return (
    <div className="space-y-4">
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="h-4 w-4 text-primary" /> Application strategy for {companyName}
          </CardTitle>
          <CardDescription>
            Ordered steps, each with the why — specific to {companyName}.
          </CardDescription>
        </CardHeader>
      </Card>
      {steps.length === 0 ? (
        <SectionEmpty>No strategy steps yet — regenerate your plan.</SectionEmpty>
      ) : (
        <ol className="space-y-3">
          {steps
            .slice()
            .sort((a, b) => (Number(a.step) || 0) - (Number(b.step) || 0))
            .map((s, i) => (
              <Reveal key={i} delay={Math.min(i * 0.04, 0.3)}>
                <SpotlightCard className="rounded-2xl">
                  <div className="flex items-start gap-3 p-4">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/15 text-xs font-bold text-primary">
                      {s.step ?? i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground">{s.action}</p>
                      <WhyNote>{s.why}</WhyNote>
                    </div>
                  </div>
                </SpotlightCard>
              </Reveal>
            ))}
        </ol>
      )}

      <CompanyActivity companyName={companyName} />
    </div>
  );
}

function CompanyActivity({ companyName }) {
  const { data: apps, loading, fn } = useFetch(getCompanyApplications);
  useEffect(() => {
    fn().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="text-sm">Your applications at {companyName}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && !apps ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !apps?.length ? (
          <p className="text-sm text-muted-foreground">
            No tracked applications at {companyName} yet. When you apply, they&apos;ll show here.
          </p>
        ) : (
          <ul className="space-y-2">
            {apps.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate text-foreground">{a.role}</span>
                <Badge variant="outline">{a.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}