"use client";

import { motion } from "framer-motion";
import {
  GraduationCap,
  MessageSquare,
  Code2,
  ListTree,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Minus,
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

const SUBS = [
  { key: "mockScore", label: "Mock score", icon: GraduationCap },
  { key: "communication", label: "Communication", icon: MessageSquare },
  { key: "technical", label: "Technical depth", icon: Code2 },
  { key: "structure", label: "Structure", icon: ListTree },
  { key: "quizAccuracy", label: "Quiz accuracy", icon: HelpCircle },
];

function TrendBadge({ trend }) {
  if (trend === "up")
    return (
      <Badge variant="secondary" className="gap-1 text-accent-warm">
        <TrendingUp className="h-3.5 w-3.5" /> Improving
      </Badge>
    );
  if (trend === "down")
    return (
      <Badge variant="secondary" className="gap-1 text-rose-400">
        <TrendingDown className="h-3.5 w-3.5" /> Slipping
      </Badge>
    );
  if (trend === "flat")
    return (
      <Badge variant="secondary" className="gap-1">
        <Minus className="h-3.5 w-3.5" /> Steady
      </Badge>
    );
  return null;
}

export default function InterviewReadinessCard({ readiness }) {
  if (!readiness) return null;

  const { score, level, levelBlurb, subs = {}, trend } = readiness;
  const hasSessions = (subs.sessions ?? 0) > 0;

  return (
    <Card className="glass">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/15 text-primary">
              <GraduationCap className="h-4 w-4" />
            </span>
            Interview readiness
          </CardTitle>
          <CardDescription className="mt-1">
            Recent form across {hasSessions ? `${subs.sessions} mock(s)` : "quizzes"}.
          </CardDescription>
        </div>
        <TrendBadge trend={trend} />
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="text-2xl font-bold">{score}</span>
            <span className="text-xs text-muted-foreground">/ 100</span>
          </div>
          <Progress value={score} className="h-2" />
          <p className="mt-2 text-sm font-medium text-foreground">{level}</p>
          <p className="text-xs text-muted-foreground">{levelBlurb}</p>
        </div>

        <div className="grid gap-2.5">
          {SUBS.map(({ key, label, icon: Icon }) => {
            const value = subs[key] ?? 0;
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, x: -6 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="grid grid-cols-[1fr_auto] items-center gap-3"
              >
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
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}