"use client";

import React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  BriefcaseIcon,
  LineChart as LineIcon,
  TrendingUp,
  TrendingDown,
  Brain,
  Sparkles,
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  GraduationCap,
  PenBox,
  KanbanSquare,
  ArrowRight,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SpotlightCard } from "@/components/site/spotlight-card";
import { AnimatedCounter } from "@/components/site/animated-counter";
import { Reveal } from "@/components/site/reveal";
import WeeklyDigestCard from "./weekly-digest-card";
import ChangeIndustryDialog from "./change-industry-dialog";
import PlanStatusCard from "./plan-status-card";

// recharts is the single biggest dependency on this page. Code-split every
// chart into its own chunk so the dashboard's First Load JS stays small and
// the charting library only downloads as each card hydrates.
const NovaScoreCard = dynamic(() => import("./nova-score-card"), {
  ssr: false,
  loading: () => <div className="h-[220px] animate-pulse rounded-2xl bg-muted/30" />,
});
const SalaryChart = dynamic(() => import("./salary-chart"), {
  ssr: false,
  loading: () => <div className="h-[420px] animate-pulse rounded-2xl bg-muted/30" />,
});
const GrowthRadialChart = dynamic(() => import("./growth-radial-chart"), {
  ssr: false,
  loading: () => <div className="h-[420px] animate-pulse rounded-2xl bg-muted/30" />,
});

const demandColor = (level) => {
  switch (String(level).toLowerCase()) {
    case "high": return "text-emerald-500";
    case "medium": return "text-amber-500";
    case "low": return "text-rose-500";
    default: return "text-muted-foreground";
  }
};

const demandBar = (level) => {
  switch (String(level).toLowerCase()) {
    case "high": return "bg-emerald-500";
    case "medium": return "bg-amber-500";
    case "low": return "bg-rose-500";
    default: return "bg-muted-foreground";
  }
};

const outlookMeta = (outlook) => {
  switch (String(outlook).toLowerCase()) {
    case "positive": return { icon: TrendingUp, color: "text-emerald-500" };
    case "neutral": return { icon: LineIcon, color: "text-amber-500" };
    case "negative": return { icon: TrendingDown, color: "text-rose-500" };
    default: return { icon: LineIcon, color: "text-muted-foreground" };
  }
};

const quickActions = [
  { icon: FileText, label: "Build resume", href: "/resume", hint: "ATS-optimized" },
  { icon: GraduationCap, label: "Practice interview", href: "/interview", hint: "Role-specific" },
  { icon: PenBox, label: "Cover letter", href: "/ai-cover-letter", hint: "AI-generated" },
  { icon: KanbanSquare, label: "Track applications", href: "/applications", hint: "Kanban board" },
];

function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {quickActions.map((a, i) => {
        const Icon = a.icon;
        return (
          <motion.div
            key={a.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
          >
            <Link
              href={a.href}
              className="spotlight-card group flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-elevated transition-all duration-300 ease-spring hover:-translate-y-1 hover:border-primary/40 hover:shadow-glow"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg ring-aurora text-white shadow-glow">
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{a.label}</span>
                <span className="block truncate text-xs text-muted-foreground">{a.hint}</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, sub, children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <SpotlightCard className="glass overflow-hidden rounded-xl border border-border transition-all duration-300 ease-spring hover:-translate-y-1 hover:border-primary/30 hover:shadow-glow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
          <Icon className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {children}
          {sub && <p className="mt-2 text-xs text-muted-foreground">{sub}</p>}
        </CardContent>
      </SpotlightCard>
    </motion.div>
  );
}

export default function DashboardView({ insights, userSkills = [], nova = null, planInfo = null }) {
  const OutlookIcon = outlookMeta(insights.marketOutlook).icon;
  const outlookColor = outlookMeta(insights.marketOutlook).color;

  const lastUpdatedDate = format(new Date(insights.lastUpdated), "dd MMM yyyy");
  const nextUpdateDistance = formatDistanceToNow(new Date(insights.nextUpdate), {
    addSuffix: true,
  });

  // Skill-gap analysis: which recommended skills the user already has vs gaps.
  const userSkillSet = new Set(userSkills.map((s) => String(s).toLowerCase()));
  const recommended = insights.recommendedSkills || [];
  const have = recommended.filter((s) => userSkillSet.has(String(s).toLowerCase()));
  const gaps = recommended.filter((s) => !userSkillSet.has(String(s).toLowerCase()));
  const haveRatio = recommended.length ? Math.round((have.length / recommended.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {planInfo && (
        <PlanStatusCard
          plan={planInfo.plan}
          subscriptionStatus={planInfo.subscriptionStatus}
          currentPeriodEnd={planInfo.currentPeriodEnd}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1.5">
            <Clock className="h-3 w-3" />
            Last updated {lastUpdatedDate}
          </Badge>
          <Badge variant="secondary" className="gap-1.5">
            <Sparkles className="h-3 w-3 text-primary" />
            Next refresh {nextUpdateDistance}
          </Badge>
        </div>
        <ChangeIndustryDialog currentIndustry={insights.industry} />
      </div>

      {/* Quick actions */}
      <QuickActions />

      {/* NovaScore — readiness composite */}
      {nova && <NovaScoreCard nova={nova} />}

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={OutlookIcon} label="Market outlook" value={insights.marketOutlook} delay={0}>
          <p className={`mt-1 text-xs ${outlookColor}`}>{insights.marketOutlook} outlook</p>
        </KpiCard>

        <KpiCard icon={TrendingUp} label="Industry growth" value={<AnimatedCounter value={insights.growthRate} decimals={1} suffix="%" />} delay={0.05}>
          <Progress value={Math.min(insights.growthRate, 100)} className="mt-3 h-1.5" />
        </KpiCard>

        <KpiCard icon={BriefcaseIcon} label="Demand level" value={insights.demandLevel} delay={0.1}>
          <div className={`mt-3 h-1.5 w-full rounded-full ${demandBar(insights.demandLevel)}`} />
        </KpiCard>

        <KpiCard icon={Brain} label="Top skills" value={`${insights.topSkills.length} skills`} delay={0.15}>
          <div className="mt-2 flex flex-wrap gap-1">
            {insights.topSkills.slice(0, 4).map((skill) => (
              <Badge key={skill} variant="secondary" className="font-normal">{skill}</Badge>
            ))}
          </div>
        </KpiCard>
      </div>

      {/* Salary + growth radial */}
      <Reveal>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
          <SalaryChart salaryRanges={insights.salaryRanges} />
          <GrowthRadialChart growthRate={insights.growthRate} />
        </div>
      </Reveal>

      {/* Weekly digest */}
      {nova && <WeeklyDigestCard digest={nova.digest} />}

      {/* Skill gap + trends */}
      <Reveal delay={0.05}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Your skill gap
            </CardTitle>
            <CardDescription>
              {have.length} of {recommended.length} recommended skills already in your profile
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                <span>Coverage</span>
                <span>{haveRatio}%</span>
              </div>
              <Progress value={haveRatio} className="h-2" />
            </div>
            {have.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">Skills you have</p>
                <div className="flex flex-wrap gap-1.5">
                  {have.map((s) => (
                    <Badge key={s} className="gap-1 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20">
                      <CheckCircle2 className="h-3 w-3" /> {s}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {gaps.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">Gaps to close</p>
                <div className="flex flex-wrap gap-1.5">
                  {gaps.map((s) => (
                    <Badge key={s} variant="outline" className="gap-1 font-normal">
                      <Circle className="h-3 w-3 text-primary" /> {s}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {recommended.length === 0 && (
              <p className="text-sm text-muted-foreground">No recommended skills yet.</p>
            )}
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle>Key industry trends</CardTitle>
            <CardDescription>What's shaping your field right now</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {insights.keyTrends.map((trend, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start gap-2.5"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ring-aurora" />
                  <span className="text-sm">{trend}</span>
                </motion.li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
      </Reveal>

      {/* Recommended skills */}
      <Reveal delay={0.1}>
      <Card className="glass">
        <CardHeader>
          <CardTitle>Recommended skills to develop</CardTitle>
          <CardDescription>Skills to consider learning next</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {insights.recommendedSkills.map((skill) => {
              const has = userSkillSet.has(String(skill).toLowerCase());
              return (
                <Badge
                  key={skill}
                  variant={has ? "secondary" : "outline"}
                  className="gap-1 font-normal"
                >
                  {has && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
                  {skill}
                </Badge>
              );
            })}
          </div>
        </CardContent>
      </Card>
      </Reveal>
    </div>
  );
}