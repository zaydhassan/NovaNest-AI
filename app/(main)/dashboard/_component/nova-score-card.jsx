"use client";

import { motion } from "framer-motion";
import {
  RadialBar,
  RadialBarChart,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import { Flame, Zap, TrendingUp, FileText, GraduationCap, PenBox, Briefcase, Target } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const PILLARS = [
  { key: "resume", label: "Resume", icon: FileText },
  { key: "interview", label: "Interview", icon: GraduationCap },
  { key: "coverLetter", label: "Cover letters", icon: PenBox },
  { key: "applications", label: "Applications", icon: Briefcase },
  { key: "marketFit", label: "Market fit", icon: Target },
];

export default function NovaScoreCard({ nova }) {
  if (!nova) return null;

  const { score, breakdown, level, levelBlurb, xp, streak } = nova;
  const radialData = [{ name: "score", value: score }];

  return (
    <Card className="glass overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/15 text-primary">
              <TrendingUp className="h-4 w-4" />
            </span>
            NovaScore
          </CardTitle>
          <CardDescription className="mt-1">
            Your career-readiness composite, updated as you use NovaNest.
          </CardDescription>
        </div>
        <div className="flex shrink-0 gap-2">
          <Badge variant="secondary" className="gap-1.5">
            <Flame className="h-3.5 w-3.5 text-amber-500" />
            {streak || 0}-day streak
          </Badge>
          <Badge variant="secondary" className="gap-1.5">
            <Zap className="h-3.5 w-3.5 text-primary" />
            {(xp || 0).toLocaleString()} XP
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid gap-6 md:grid-cols-[200px_1fr]">
          {/* Radial score */}
          <div className="relative h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                innerRadius="72%"
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
                  fill="hsl(var(--primary))"
                />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                key={score}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="text-5xl font-extrabold"
              >
                {score}
              </motion.span>
              <span className="text-xs text-muted-foreground">/ 100</span>
            </div>
          </div>

          {/* Level + pillar breakdown */}
          <div className="flex flex-col justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-foreground">{level}</p>
              <p className="text-xs text-muted-foreground">{levelBlurb}</p>
            </div>

            <div className="grid gap-2.5">
              {PILLARS.map(({ key, label, icon: Icon }) => {
                const value = breakdown?.[key] ?? 0;
                return (
                  <div key={key} className="grid grid-cols-[1fr_auto] items-center gap-3">
                    <div className="min-w-0">
                      <div className="mb-1 flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{label}</span>
                      </div>
                      <Progress value={value} className="h-1.5" />
                    </div>
                    <span className="w-8 text-right text-xs font-semibold tabular-nums">
                      {value}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}