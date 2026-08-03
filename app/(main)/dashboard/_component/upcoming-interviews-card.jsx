"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CalendarClock, ArrowRight } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STATUS_META = {
  INTERVIEW: { label: "Interview", className: "bg-chart-2/15 text-foreground" },
  OFFER: { label: "Offer", className: "bg-chart-4/15 text-foreground" },
};

/**
 * UpcomingInterviewsCard — live opportunities in the INTERVIEW/OFFER stages.
 * Derived from real `getApplications()` data (no new action needed).
 *
 * @param {{ applications: any[] }} props
 */
export default function UpcomingInterviewsCard({ applications = [] }) {
  const upcoming = (applications ?? [])
    .filter((a) => a.status === "INTERVIEW" || a.status === "OFFER")
    .sort((a, b) => new Date(b.appliedAt ?? b.updatedAt ?? 0) - new Date(a.appliedAt ?? a.updatedAt ?? 0))
    .slice(0, 5);

  return (
    <Card className="glass overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/15 text-primary">
              <CalendarClock className="h-4 w-4" />
            </span>
            Upcoming interviews
          </CardTitle>
          <CardDescription className="mt-1">
            Live opportunities in your pipeline — don&rsquo;t let them go cold.
          </CardDescription>
        </div>
        <Link
          href="/applications"
          className="flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-accent"
        >
          Open <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent>
        {upcoming.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <CalendarClock className="h-8 w-8 text-muted-foreground/60" />
            <p className="max-w-xs text-sm text-muted-foreground">
              No live interviews right now. Move an application to the Interview
              stage to track it here.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {upcoming.map((a, i) => {
              const meta = STATUS_META[a.status] ?? STATUS_META.INTERVIEW;
              const dateRef = a.appliedAt ?? a.updatedAt;
              return (
                <motion.li
                  key={a.id}
                  initial={{ opacity: 0, y: 6 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link
                    href={`/applications/${a.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/40 p-3 transition-colors hover:border-primary/30 hover:bg-accent/5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{a.role}</p>
                      <p className="truncate text-xs text-muted-foreground">{a.company}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <Badge variant="secondary" className={meta.className}>{meta.label}</Badge>
                      {dateRef && (
                        <span className="text-[11px] text-muted-foreground/70">
                          {formatDistanceToNow(new Date(dateRef), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                  </Link>
                </motion.li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}