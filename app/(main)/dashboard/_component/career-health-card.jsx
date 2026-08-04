"use client";

import { motion } from "framer-motion";
import {
  RadialBar,
  RadialBarChart,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import {
  Activity,
  FileText,
  GraduationCap,
  PenBox,
  Briefcase,
  Target,
  Brain,
  BookOpen,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const PILLARS = [
  { key: "resume", label: "Resume", icon: FileText },
  { key: "interview", label: "Interview", icon: GraduationCap },
  { key: "coverLetter", label: "Cover letters", icon: PenBox },
  { key: "applications", label: "Applications", icon: Briefcase },
  { key: "marketFit", label: "Market fit", icon: Target },
  { key: "learning", label: "Learning", icon: BookOpen },
  { key: "memory", label: "Memory", icon: Brain },
];

export default function CareerHealthCard({ health }) {
  if (!health) return null;

  const { score, breakdown = {}, level, levelBlurb, delta = 0 } = health;
  const radialData = [{ name: "health", value: score }];

  return (
    <Card className="glass overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/15 text-primary">
              <Activity className="h-4 w-4" />
            </span>
            Career Health
          </CardTitle>
          <CardDescription className="mt-1">
            Your composite readiness, extended with learning + memory pillars.
          </CardDescription>
        </div>
        {delta > 0 && (
          <Badge variant="secondary" className="gap-1.5 text-accent-warm">
            +{delta} from NovaScore
          </Badge>
        )}
      </CardHeader>

      <CardContent>
        <div className="grid gap-6 md:grid-cols-[200px_1fr]">
          <div className="relative h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                innerRadius="72%"
                outerRadius="100%"
                data={radialData}
                startAngle={90}
                endAngle={-270}
              >
                <defs>
                  <linearGradient id="careerHealthGauge" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--accent))" />
                    <stop offset="55%" stopColor="hsl(var(--primary))" />
                    <stop offset="100%" stopColor="hsl(var(--accent-warm))" />
                  </linearGradient>
                </defs>
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar
                  background={{ fill: "hsl(var(--muted))" }}
                  dataKey="value"
                  cornerRadius={20}
                  fill="url(#careerHealthGauge)"
                />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                key={score}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="bg-gradient-to-r from-[hsl(var(--accent))] via-[hsl(var(--primary))] to-[hsl(var(--accent-warm))] bg-clip-text text-5xl font-extrabold text-transparent aurora-text"
              >
                {score}
              </motion.span>
              <span className="text-xs text-muted-foreground">/ 100</span>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-foreground">{level}</p>
              <p className="text-xs text-muted-foreground">{levelBlurb}</p>
            </div>

            <div className="grid gap-2.5">
              {PILLARS.map(({ key, label, icon: Icon }) => {
                const value = breakdown[key] ?? 0;
                const isCareerPillar = key === "learning" || key === "memory";
                return (
                  <div key={key} className="grid grid-cols-[1fr_auto] items-center gap-3">
                    <div className="min-w-0">
                      <div className="mb-1 flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{label}</span>
                        {isCareerPillar && (
                          <span className="text-[10px] uppercase tracking-wide text-accent">
                            new
                          </span>
                        )}
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