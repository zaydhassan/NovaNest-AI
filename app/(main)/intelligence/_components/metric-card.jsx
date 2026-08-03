"use client";

import { motion } from "framer-motion";
import {
  RadialBar,
  RadialBarChart,
  PolarAngleAxis,
  ResponsiveContainer,
  Area,
  AreaChart,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WhyNote } from "@/components/site/why-note";

// Unique gradient ids per metric key so multiple gauges on one page don't clash.
const GRADIENT_IDS = {
  careerHealth: "intelGaugeCareerHealth",
  resume: "intelGaugeResume",
  interviewReadiness: "intelGaugeReadiness",
  learningVelocity: "intelGaugeVelocity",
  applicationSuccessRate: "intelGaugeApplication",
  skillGrowth: "intelGaugeSkill",
  consistency: "intelGaugeConsistency",
  productivity: "intelGaugeProductivity",
};

/**
 * MetricCard — the reusable Career Intelligence card. Renders one metric:
 *  - a radial gauge (the score, 0-100)
 *  - the level + levelBlurb
 *  - Why / How to improve / What to improve (WhyNote blocks)
 *  - the evidence list (concrete data points that back the score — always shown)
 *  - an optional chart (AreaChart for series, BarChart for funnel) when the
 *    metric carries that payload.
 *
 * The gauge recipe is copied from career-health-card.jsx (the codebase's
 * established inlined RadialBarChart pattern — no shared Gauge component
 * exists, and extracting one is a no-regression-risky refactor, out of scope).
 *
 * @param {{ metric: object, icon: React.ComponentType, accent?: string, className?: string }} props
 */
export default function MetricCard({ metric, icon: Icon, accent = "hsl(var(--primary))", className = "" }) {
  if (!metric) return null;

  const { key, label, score, level, levelBlurb, evidence = [], why, how, whatToImprove, series, funnel } =
    metric;
  const radialData = [{ name: label, value: score }];
  const gradId = GRADIENT_IDS[key] || "intelGaugeDefault";
  const hasSeries = Array.isArray(series) && series.length >= 2;
  const hasFunnel = Array.isArray(funnel) && funnel.length > 0;

  return (
    <Card className={`glass overflow-hidden ${className}`}>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            {Icon && (
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/15 text-primary">
                <Icon className="h-4 w-4" />
              </span>
            )}
            {label}
          </CardTitle>
          <CardDescription className="mt-1">{levelBlurb}</CardDescription>
        </div>
        <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {level}
        </span>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {/* Gauge + score */}
        <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
          <div className="relative h-[140px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                innerRadius="72%"
                outerRadius="100%"
                data={radialData}
                startAngle={90}
                endAngle={-270}
              >
                <defs>
                  <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={accent} stopOpacity={0.8} />
                    <stop offset="100%" stopColor={accent} />
                  </linearGradient>
                </defs>
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar
                  background={{ fill: "hsl(var(--muted))" }}
                  dataKey="value"
                  cornerRadius={20}
                  fill={`url(#${gradId})`}
                />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                key={score}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="text-4xl font-extrabold tabular-nums text-foreground"
              >
                {score}
              </motion.span>
              <span className="text-[10px] text-muted-foreground">/ 100</span>
            </div>
          </div>

          {/* Why / How / What blocks */}
          <div className="flex flex-col gap-1">
            <WhyNote label="Why">{why}</WhyNote>
            <WhyNote label="How to improve">{how}</WhyNote>
            <WhyNote label="What to improve">{whatToImprove}</WhyNote>
          </div>
        </div>

        {/* Optional chart: AreaChart for series (skill growth, learning velocity) */}
        {hasSeries && (
          <div className="h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id={`${gradId}Area`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={accent} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={accent} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  width={28}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 12,
                    color: "hsl(var(--foreground))",
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={accent}
                  strokeWidth={2}
                  fill={`url(#${gradId}Area)`}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Optional chart: BarChart for funnel (application success rate) */}
        {hasFunnel && (
          <div className="h-[140px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnel} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="stage"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  width={72}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 12,
                    color: "hsl(var(--foreground))",
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                  formatter={(v) => [`${v} application${v === 1 ? "" : "s"}`, "Count"]}
                />
                <Bar dataKey="count" fill={accent} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Evidence list — always shown. This is the "supporting evidence" the
            product requires: concrete data points that produced the score. */}
        {evidence.length > 0 && (
          <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Supporting evidence
            </p>
            <ul className="grid gap-1.5">
              {evidence.map((e, i) => (
                <li key={`${e.label}-${i}`} className="flex items-baseline justify-between gap-3 text-xs">
                  <span className="text-muted-foreground">{e.label}</span>
                  <span className="text-right font-medium text-foreground">
                    {String(e.value)}
                    {e.detail ? (
                      <span className="ml-1.5 font-normal text-muted-foreground">— {e.detail}</span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}