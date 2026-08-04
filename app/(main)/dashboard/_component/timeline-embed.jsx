"use client";

import Link from "next/link";
import { motion } from "framer-motion";
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
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const TYPE_META = {
  learning: { icon: BookOpen, className: "text-accent" },
  building: { icon: Hammer, className: "text-primary" },
  applying: { icon: Send, className: "text-muted-foreground" },
  interviewing: { icon: Users, className: "text-accent-warm" },
  offer: { icon: Award, className: "text-accent-warm" },
  rejection: { icon: XCircle, className: "text-rose-400" },
  achievement: { icon: Trophy, className: "text-accent-warm" },
  coach: { icon: Sparkles, className: "text-primary" },
  github: { icon: Github, className: "text-muted-foreground" },
  milestone: { icon: Flag, className: "text-accent-warm" },
};

const GRADIENT_TYPES = new Set(["offer", "achievement", "milestone"]);

export default function TimelineEmbed({ events = [] }) {
  return (
    <Card className="glass">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/15 text-primary">
              <Flag className="h-4 w-4" />
            </span>
            Career timeline
          </CardTitle>
          <CardDescription className="mt-1">Your latest milestones, auto-generated.</CardDescription>
        </div>
        <Link
          href="/timeline"
          className="flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-accent"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Save a resume, apply, or run a mock interview to start your timeline.
          </p>
        ) : (
          <ol className="relative space-y-4 pl-4">
            <span className="absolute left-[3px] top-1 bottom-1 w-px bg-border" />
            {events.map((ev, i) => {
              const meta = TYPE_META[ev.type] ?? TYPE_META.milestone;
              const Icon = meta.icon;
              const gradient = GRADIENT_TYPES.has(ev.type);
              return (
                <motion.li
                  key={ev.id}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04 }}
                  className="relative"
                >
                  <span
                    className={`absolute -left-[13px] top-1 grid h-2.5 w-2.5 place-items-center rounded-full ring-2 ring-card ${
                      gradient ? "ring-aurora" : "bg-muted-foreground"
                    }`}
                  />
                  <div className="flex items-start gap-2.5">
                    <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${meta.className}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{ev.title}</p>
                      {ev.description && (
                        <p className="line-clamp-1 text-xs text-muted-foreground">
                          {ev.description}
                        </p>
                      )}
                      <p className="mt-0.5 text-[11px] text-muted-foreground/70">
                        {format(new Date(ev.occurredAt), "dd MMM yyyy")}
                      </p>
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}