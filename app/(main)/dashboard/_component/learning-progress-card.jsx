"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Rocket, ArrowRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const STATUS_META = {
  todo: { label: "To do", color: "hsl(var(--muted-foreground))" },
  learning: { label: "Learning", color: "hsl(var(--chart-2))" },
  learned: { label: "Learned", color: "hsl(var(--chart-4))" },
  needs_review: { label: "Needs review", color: "hsl(var(--chart-3))" },
};
const STATUS_ORDER = ["learning", "learned", "needs_review", "todo"];

/**
 * LearningProgressCard — skill-building status from real `getTopics()` data.
 * Shows total topics, a learned-progress bar, and a per-status breakdown.
 *
 * @param {{ learningTopics: any[] }} props
 */
export default function LearningProgressCard({ learningTopics = [] }) {
  const list = learningTopics ?? [];
  const total = list.length;
  const counts = { todo: 0, learning: 0, learned: 0, needs_review: 0 };
  let sessions = 0;
  for (const t of list) {
    if (counts[t.status] != null) counts[t.status] += 1;
    sessions += t._count?.sessions ?? 0;
  }
  const learnedPct = total ? Math.round((counts.learned / total) * 100) : 0;

  return (
    <Card className="glass overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/15 text-primary">
              <Rocket className="h-4 w-4" />
            </span>
            Learning progress
          </CardTitle>
          <CardDescription className="mt-1">
            The skills you&rsquo;re building toward your goal, and where you stand.
          </CardDescription>
        </div>
        <Link
          href="/learning"
          className="flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-accent"
        >
          Open board <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <Rocket className="h-8 w-8 text-muted-foreground/60" />
            <p className="text-sm text-muted-foreground">
              Add a skill to start tracking your learning progress.
            </p>
            <Link
              href="/learning"
              className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-accent"
            >
              Open learning <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-bold tnum">{total}</span>
              <span className="text-xs text-muted-foreground">
                skills tracked · {sessions} practice session{sessions === 1 ? "" : "s"}
              </span>
            </div>
            <div>
              <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                <span>Mastered</span>
                <span className="tnum">{learnedPct}%</span>
              </div>
              <Progress value={learnedPct} className="h-2" />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {STATUS_ORDER.map((key, i) => {
                const meta = STATUS_META[key];
                const count = counts[key];
                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 6 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-2 rounded-lg border border-border bg-background/40 p-2.5"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: meta.color }}
                    />
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {meta.label}
                    </span>
                    <span className="ml-auto text-sm font-bold tnum">{count}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}