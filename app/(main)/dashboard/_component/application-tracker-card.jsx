"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { KanbanSquare, ArrowRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const COLUMNS = [
  { key: "SAVED", label: "Saved", accent: "hsl(var(--muted-foreground))" },
  { key: "APPLIED", label: "Applied", accent: "hsl(var(--chart-1))" },
  { key: "SCREENING", label: "Screening", accent: "hsl(var(--chart-3))" },
  { key: "INTERVIEW", label: "Interview", accent: "hsl(var(--chart-2))" },
  { key: "OFFER", label: "Offer", accent: "hsl(var(--chart-4))" },
  { key: "REJECTED", label: "Rejected", accent: "hsl(var(--chart-5))" },
];

export default function ApplicationTrackerCard({ applications = [] }) {
  const list = applications ?? [];
  const total = list.length;
  const counts = COLUMNS.reduce((acc, c) => {
    acc[c.key] = 0;
    return acc;
  }, {});
  for (const a of list) {
    if (counts[a.status] != null) counts[a.status] += 1;
  }
  const interviewing = counts.INTERVIEW + counts.OFFER;
  const maxCount = Math.max(1, ...Object.values(counts));

  return (
    <Card className="glass overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/15 text-primary">
              <KanbanSquare className="h-4 w-4" />
            </span>
            Application tracker
          </CardTitle>
          <CardDescription className="mt-1">
            Your pipeline at a glance — spot momentum and where to follow up next.
          </CardDescription>
        </div>
        <Link
          href="/applications"
          className="flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-accent"
        >
          Open pipeline <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <KanbanSquare className="h-8 w-8 text-muted-foreground/60" />
            <p className="text-sm text-muted-foreground">
              Add an application to start tracking your pipeline.
            </p>
            <Link
              href="/applications"
              className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-accent"
            >
              Add application <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-bold tnum">{total}</span>
              <span className="text-xs text-muted-foreground">
                {interviewing > 0
                  ? `${interviewing} in interview stage`
                  : "total applications"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {COLUMNS.map((col, i) => {
                const count = counts[col.key];
                const width = Math.round((count / maxCount) * 100);
                return (
                  <motion.div
                    key={col.key}
                    initial={{ opacity: 0, y: 6 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.04 }}
                    className="rounded-lg border border-border bg-background/40 p-2.5"
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: col.accent }}
                      />
                      <span className="text-[11px] font-medium text-muted-foreground">
                        {col.label}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-baseline justify-between">
                      <span className="text-lg font-bold tnum">{count}</span>
                    </div>
                    <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${width}%`, background: col.accent }}
                      />
                    </div>
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