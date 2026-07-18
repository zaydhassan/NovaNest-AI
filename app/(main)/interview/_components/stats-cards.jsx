"use client";

import { motion } from "framer-motion";
import { Brain, Target, Trophy, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

function StatCard({ icon: Icon, label, value, sub, accent, delay = 0, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className="glass overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
          <span className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: accent }}>
            <Icon className="h-4 w-4 text-white" />
          </span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {children}
          {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function StatsCards({ assessments }) {
  const list = assessments ?? [];

  if (!list.length) {
    return (
      <Card className="glass">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-xl ring-aurora text-white">
            <Target className="h-6 w-6" />
          </span>
          <p className="font-medium">No practice sessions yet</p>
          <p className="text-sm text-muted-foreground">
            Start a mock interview to see your stats here.
          </p>
        </CardContent>
      </Card>
    );
  }

  const avg = (list.reduce((s, a) => s + a.quizScore, 0) / list.length).toFixed(1);
  const totalQuestions = list.reduce((s, a) => s + a.questions.length, 0);
  const latest = list[list.length - 1];
  const best = list.reduce((best, a) => (a.quizScore > best ? a.quizScore : best), 0);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        icon={Trophy}
        label="Average score"
        value={`${avg}%`}
        sub="Across all assessments"
        accent="linear-gradient(135deg,hsl(var(--chart-1)),hsl(var(--chart-2)))"
        delay={0}
      >
        <Progress value={Number(avg)} className="mt-3 h-1.5" />
      </StatCard>

      <StatCard
        icon={Brain}
        label="Questions practiced"
        value={totalQuestions}
        sub="Total answered"
        accent="linear-gradient(135deg,hsl(var(--chart-3)),hsl(var(--chart-1)))"
        delay={0.05}
      />

      <StatCard
        icon={Award}
        label="Best score"
        value={`${best.toFixed(1)}%`}
        sub="Your highest result"
        accent="linear-gradient(135deg,hsl(var(--chart-4)),hsl(var(--chart-2)))"
        delay={0.1}
      />

      <StatCard
        icon={Target}
        label="Latest score"
        value={`${latest.quizScore.toFixed(1)}%`}
        sub="Most recent quiz"
        accent="linear-gradient(135deg,hsl(var(--chart-2)),hsl(var(--chart-5)))"
        delay={0.15}
      />
    </div>
  );
}