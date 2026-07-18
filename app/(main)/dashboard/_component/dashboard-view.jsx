"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadialBar,
  RadialBarChart,
  PolarAngleAxis,
} from "recharts";
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
import NovaScoreCard from "./nova-score-card";
import WeeklyDigestCard from "./weekly-digest-card";
import ChangeIndustryDialog from "./change-industry-dialog";

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

function KpiCard({ icon: Icon, label, value, sub, children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className="glass overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
          <Icon className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {children}
          {sub && <p className="mt-2 text-xs text-muted-foreground">{sub}</p>}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function GlassTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-lg p-3 text-xs shadow-glass">
      <p className="mb-1 font-medium text-foreground">{label}</p>
      {payload.map((item) => (
        <p key={item.name} className="flex items-center gap-1.5 text-muted-foreground">
          <span className="h-2 w-2 rounded-full" style={{ background: item.color || item.fill }} />
          {item.name}: <span className="font-medium text-foreground">{formatter ? formatter(item.value) : item.value}</span>
        </p>
      ))}
    </div>
  );
}

export default function DashboardView({ insights, userSkills = [], nova = null }) {
  const salaryData = insights.salaryRanges.map((range) => ({
    name: range.role,
    min: Math.round(range.min / 1000),
    max: Math.round(range.max / 1000),
    median: Math.round(range.median / 1000),
  }));

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

  const radialData = [{ name: "growth", value: Math.min(100, Math.max(0, insights.growthRate)) }];

  return (
    <div className="space-y-6">
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

      {/* NovaScore — readiness composite */}
      {nova && <NovaScoreCard nova={nova} />}

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={OutlookIcon} label="Market outlook" value={insights.marketOutlook} delay={0}>
          <p className={`mt-1 text-xs ${outlookColor}`}>{insights.marketOutlook} outlook</p>
        </KpiCard>

        <KpiCard icon={TrendingUp} label="Industry growth" value={`${insights.growthRate.toFixed(1)}%`} delay={0.05}>
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
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card className="glass">
          <CardHeader>
            <CardTitle>Salary ranges by role</CardTitle>
            <CardDescription>Min, median, and max (in thousands USD)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salaryData} margin={{ top: 8, right: 8, left: -16, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    stroke="hsl(var(--border))"
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} stroke="hsl(var(--border))" />
                  <Tooltip
                    cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
                    content={<GlassTooltip formatter={(v) => `$${v}K`} />}
                  />
                  <Bar dataKey="min" fill="hsl(var(--chart-1))" name="Min" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="median" fill="hsl(var(--chart-2))" name="Median" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="max" fill="hsl(var(--chart-3))" name="Max" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle>Growth rate</CardTitle>
            <CardDescription>Projected industry growth</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  innerRadius="70%"
                  outerRadius="100%"
                  data={radialData}
                  startAngle={90}
                  endAngle={-270}
                >
                  <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                  <RadialBar
                    background={{ fill: "hsl(var(--muted))" }}
                    dataKey="value"
                    cornerRadius={20}
                    fill="hsl(var(--chart-1))"
                  />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-extrabold">{insights.growthRate.toFixed(1)}%</span>
                <span className="text-xs text-muted-foreground">annual growth</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly digest */}
      {nova && <WeeklyDigestCard digest={nova.digest} />}

      {/* Skill gap + trends */}
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

      {/* Recommended skills */}
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
    </div>
  );
}