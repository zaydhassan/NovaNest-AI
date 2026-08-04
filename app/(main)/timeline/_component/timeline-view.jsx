"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { format } from "date-fns";
import {
  BookOpen,
  Hammer,
  Send,
  Users,
  Award,
  XCircle,
  Trophy,
  Sparkles,
  Github,
  Flag,
  Search,
  RefreshCw,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import useFetch from "@/hooks/use-fetch";
import { getTimeline, backfillTimelineAction } from "@/actions/timeline";

const TYPE_META = {
  learning: { icon: BookOpen, label: "Learning", className: "text-accent" },
  building: { icon: Hammer, label: "Building", className: "text-primary" },
  applying: { icon: Send, label: "Applying", className: "text-muted-foreground" },
  interviewing: { icon: Users, label: "Interviewing", className: "text-accent-warm" },
  offer: { icon: Award, label: "Offers", className: "text-accent-warm" },
  rejection: { icon: XCircle, label: "Rejections", className: "text-rose-400" },
  achievement: { icon: Trophy, label: "Achievements", className: "text-accent-warm" },
  coach: { icon: Sparkles, label: "Coaching", className: "text-primary" },
  github: { icon: Github, label: "GitHub", className: "text-muted-foreground" },
  milestone: { icon: Flag, label: "Milestones", className: "text-accent-warm" },
};

const GRADIENT_TYPES = new Set(["offer", "achievement", "milestone"]);

const SOURCE_LABELS = {
  resume: "Resume",
  application: "Application",
  mockInterview: "Mock",
  assessment: "Quiz",
  chat: "Coach",
  github: "GitHub",
  learning: "Learning",
  memory: "Memory",
  manual: "Manual",
};

const FILTER_ORDER = [
  "all",
  "building",
  "applying",
  "interviewing",
  "offer",
  "rejection",
  "learning",
  "achievement",
  "github",
  "coach",
  "milestone",
];

function matchesQuery(ev, q) {
  if (!q) return true;
  const hay = [ev.title, ev.description, ev.metadata?.company, ev.metadata?.role, ev.metadata?.skill]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(q.toLowerCase());
}

export default function TimelineView({ initialEvents = [] }) {
  const [events, setEvents] = useState(initialEvents);
  const [query, setQuery] = useState("");
  const [activeType, setActiveType] = useState("all");
  const reduced = useReducedMotion();

  const syncFetch = useFetch(backfillTimelineAction);
  const refreshFetch = useFetch(getTimeline);

  const counts = useMemo(() => {
    const map = { all: events.length };
    for (const ev of events) map[ev.type] = (map[ev.type] ?? 0) + 1;
    return map;
  }, [events]);

  const filtered = useMemo(
    () =>
      events.filter(
        (ev) =>
          (activeType === "all" || ev.type === activeType) && matchesQuery(ev, query.trim())
      ),
    [events, activeType, query]
  );

  const grouped = useMemo(() => {
    const buckets = new Map();
    for (const ev of filtered) {
      const key = format(new Date(ev.occurredAt), "MMMM yyyy");
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(ev);
    }
    return Array.from(buckets.entries());
  }, [filtered]);

  const handleSync = async () => {
    const res = await syncFetch.fn();
    if (res) {
      const fresh = await refreshFetch.fn({ limit: 500 });
      if (fresh) setEvents(fresh);
    }
  };

  const syncing = syncFetch.loading || refreshFetch.loading;
  const hasEvents = events.length > 0;
  const hasResults = filtered.length > 0;

  return (
    <div className="space-y-5">
      <Card className="glass">
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search milestones, companies, skills…"
                className="pl-9"
                aria-label="Search timeline"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={syncing}
              className="shrink-0 gap-2"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", syncing && "animate-spin")} />
              {syncing ? "Syncing…" : "Sync milestones"}
            </Button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {FILTER_ORDER.map((key) => {
              const isAll = key === "all";
              const meta = isAll ? null : TYPE_META[key];
              const Icon = meta?.icon ?? Flag;
              const label = isAll ? "All" : meta?.label ?? key;
              const count = counts[key] ?? 0;
              if (!isAll && !hasEvents) return null;
              if (!isAll && count === 0) return null;
              const active = activeType === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveType(key)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    active
                      ? "border-primary/60 bg-primary/10 text-foreground"
                      : "border-border bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                  )}
                >
                  <Icon className={cn("h-3.5 w-3.5", !isAll && meta?.className)} />
                  {label}
                  <span className="tnum rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {!hasEvents ? (
        <Card className="glass">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No milestones yet. Save a resume, apply for a role, or log a learning session to start
            your timeline.
          </CardContent>
        </Card>
      ) : !hasResults ? (
        <Card className="glass">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No milestones match your filters.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {grouped.map(([month, items]) => (
            <div key={month}>
              <p className="mb-3 sticky top-2 z-10 inline-block rounded-full border border-border bg-card/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur">
                {month}
              </p>
              <div className="relative">
                <span
                  aria-hidden="true"
                  className="absolute left-[5px] top-1 bottom-1 w-px bg-border"
                />
                <ol className="relative space-y-3 pl-5">
                {items.map((ev, i) => {
                  const meta = TYPE_META[ev.type] ?? TYPE_META.milestone;
                  const Icon = meta.icon;
                  const gradient = GRADIENT_TYPES.has(ev.type);
                  const sourceLabel = SOURCE_LABELS[ev.sourceType] ?? ev.sourceType;
                  return (
                    <motion.li
                      key={ev.id}
                      initial={reduced ? false : { opacity: 0, x: -8 }}
                      whileInView={reduced ? undefined : { opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={reduced ? undefined : { delay: Math.min(i * 0.03, 0.3) }}
                      className="relative"
                    >
                      <span
                        className={cn(
                          "absolute -left-[18px] top-1 grid h-3 w-3 place-items-center rounded-full ring-2 ring-card",
                          gradient ? "ring-aurora" : "bg-muted-foreground/70"
                        )}
                      />
                      <Card className="glass overflow-hidden">
                        <CardContent className="flex items-start gap-3 p-3.5">
                          <span
                            className={cn(
                              "grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/[0.04]",
                              meta.className
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">
                              {ev.title}
                            </p>
                            {ev.description && (
                              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                                {ev.description}
                              </p>
                            )}
                            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground/70">
                              <span className="tnum">
                                {format(new Date(ev.occurredAt), "d MMM yyyy")}
                              </span>
                              <span className="text-muted-foreground/30">•</span>
                              <span className="rounded-md bg-white/[0.04] px-1.5 py-0.5">
                                {sourceLabel}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.li>
                  );
                })}
                </ol>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}