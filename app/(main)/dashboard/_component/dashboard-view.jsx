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
  RefreshCw,
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
import TodaysMissionCard from "./todays-mission-card";
import ApplicationTrackerCard from "./application-tracker-card";
import UpcomingInterviewsCard from "./upcoming-interviews-card";
import LearningProgressCard from "./learning-progress-card";
import RecentConversationsCard from "./recent-conversations-card";
import RecommendedActionsCard from "./recommended-actions-card";

// recharts is the single biggest dependency on this page. Code-split every
// chart into its own chunk so the dashboard's First Load JS stays small and
// the charting library only downloads as each card hydrates.
const NovaScoreCard = dynamic(() => import("./nova-score-card"), {
  ssr: false,
  loading: () => <div className="h-[220px] shimmer rounded-2xl" />,
});
const SalaryChart = dynamic(() => import("./salary-chart"), {
  ssr: false,
  loading: () => <div className="h-[420px] shimmer rounded-2xl" />,
});
const GrowthRadialChart = dynamic(() => import("./growth-radial-chart"), {
  ssr: false,
  loading: () => <div className="h-[420px] shimmer rounded-2xl" />,
});

// Career OS cards (M4). The two recharts-backed cards are code-split (ssr:false)
// to keep the dashboard's First Load JS small; the three lightweight cards are
// imported directly.
const CareerHealthCard = dynamic(() => import("./career-health-card"), {
  ssr: false,
  loading: () => <div className="h-[260px] shimmer rounded-2xl" />,
});
const SkillGrowthCard = dynamic(() => import("./skill-growth-card"), {
  ssr: false,
  loading: () => <div className="h-[260px] shimmer rounded-2xl" />,
});
import InterviewReadinessCard from "./interview-readiness-card";
import TimelineEmbed from "./timeline-embed";
import CoachInsightsEmbed from "./coach-insights-embed";

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
              className="spotlight-card group flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card transition-all duration-300 ease-spring hover:-translate-y-1 hover:border-primary/40 hover:shadow-glow"
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
          <div className="text-2xl font-bold tnum">{value}</div>
          {children}
          {sub && <p className="mt-2 text-xs text-muted-foreground">{sub}</p>}
        </CardContent>
      </SpotlightCard>
    </motion.div>
  );
}

// Section divider — the eyebrow pill motif reused from PageHeader so each
// Command Center section reads as a deliberate group, not a flat list.
function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-2 pt-2">
      <span className="h-1.5 w-1.5 rounded-full ring-aurora" />
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {children}
      </h2>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

export default function DashboardView({
  insights,
  userSkills = [],
  nova = null,
  planInfo = null,
  careerHealth = null,
  readiness = null,
  skillGrowth = null,
  recentTimeline = [],
  coachInsights = [],
  applications = [],
  chatSessions = [],
  learningTopics = [],
  recommendations = [],
  goal = null,
}) {
  const OutlookIcon = outlookMeta(insights.marketOutlook).icon;
  const outlookColor = outlookMeta(insights.marketOutlook).color;

  const lastUpdatedDate = format(new Date(insights.lastUpdated), "dd MMM yyyy");
  const nextUpdateDate = new Date(insights.nextUpdate);
  const isOverdue = nextUpdateDate <= new Date();
  const nextUpdateDistance = formatDistanceToNow(nextUpdateDate, {
    addSuffix: true,
  });

  // Skill-gap analysis: which recommended skills the user already has vs gaps.
  const userSkillSet = new Set(userSkills.map((s) => String(s).toLowerCase()));
  const recommended = insights.recommendedSkills || [];
  const have = recommended.filter((s) => userSkillSet.has(String(s).toLowerCase()));
  const gaps = recommended.filter((s) => !userSkillSet.has(String(s).toLowerCase()));
  const haveRatio = recommended.length ? Math.round((have.length / recommended.length) * 100) : 0;

  // Recommendation-kind coach insights feed Today's Mission + Recommended Actions.
  const recommendationInsights = (coachInsights ?? []).filter(
    (i) => i?.kind === "recommendation"
  );

  return (
    <div className="space-y-8">
      {/* ── Plan status ── */}
      {planInfo && (
        <PlanStatusCard
          plan={planInfo.plan}
          subscriptionStatus={planInfo.subscriptionStatus}
          currentPeriodEnd={planInfo.currentPeriodEnd}
        />
      )}

      {/* ── Command tier: today's mission + data freshness ── */}
      <Reveal>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <TodaysMissionCard
              goal={goal}
              digest={nova?.digest}
              recommendations={recommendations}
              recommendationInsights={recommendationInsights}
            />
          </div>
          <aside className="flex flex-col gap-3">
            <div className="glass flex flex-1 flex-col justify-center gap-2 rounded-xl border border-border p-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Industry data
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="gap-1.5">
                  <Clock className="h-3 w-3" />
                  Updated {lastUpdatedDate}
                </Badge>
                {isOverdue ? (
                  <Badge variant="secondary" className="gap-1.5 border-amber-500/30 bg-amber-500/15 text-amber-500">
                    <RefreshCw className="h-3 w-3" />
                    Refresh overdue
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1.5">
                    <Sparkles className="h-3 w-3 text-primary" />
                    Refresh {nextUpdateDistance}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                AI-analyzed trends for {insights.industry}.
              </p>
            </div>
            <ChangeIndustryDialog currentIndustry={insights.industry} />
          </aside>
        </div>
      </Reveal>

      {/* ── Quick actions ── */}
      <QuickActions />

      {/* ── Vital signs ── */}
      <div className="space-y-4">
        <SectionLabel>Vital signs</SectionLabel>
        <Reveal>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {nova && <NovaScoreCard nova={nova} />}
            {careerHealth && <CareerHealthCard health={careerHealth} />}
          </div>
        </Reveal>
        <Reveal delay={0.05}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InterviewReadinessCard readiness={readiness} />
            <SkillGrowthCard growth={skillGrowth} />
          </div>
        </Reveal>
      </div>

      {/* ── Your pipeline ── */}
      <div className="space-y-4">
        <SectionLabel>Your pipeline</SectionLabel>
        <Reveal>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ApplicationTrackerCard applications={applications} />
            <UpcomingInterviewsCard applications={applications} />
          </div>
        </Reveal>
      </div>

      {/* ── Learning ── */}
      <div className="space-y-4">
        <SectionLabel>Learning</SectionLabel>
        <Reveal>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <LearningProgressCard learningTopics={learningTopics} />
            <RecommendedActionsCard
              recommendations={recommendations}
              coachInsights={coachInsights}
            />
          </div>
        </Reveal>
      </div>

      {/* ── AI guidance ── */}
      <div className="space-y-4">
        <SectionLabel>AI guidance</SectionLabel>
        <Reveal>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <CoachInsightsEmbed insights={coachInsights} />
            <RecentConversationsCard chatSessions={chatSessions} />
          </div>
        </Reveal>
      </div>

      {/* ── The record ── */}
      <div className="space-y-4">
        <SectionLabel>The record</SectionLabel>
        <Reveal>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TimelineEmbed events={recentTimeline} />
            {nova && <WeeklyDigestCard digest={nova.digest} />}
          </div>
        </Reveal>
      </div>

      {/* ── Industry intelligence ── */}
      <div className="space-y-4">
        <SectionLabel>Industry intelligence</SectionLabel>

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
                <CardDescription>What&rsquo;s shaping your field right now</CardDescription>
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
    </div>
  );
}