"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Bell,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  PartyPopper,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const KIND_META = {
  nudge: { icon: Bell, className: "text-primary" },
  progress: { icon: TrendingUp, className: "text-accent-warm" },
  risk: { icon: AlertTriangle, className: "text-rose-400" },
  recommendation: { icon: Lightbulb, className: "text-accent" },
  celebration: { icon: PartyPopper, className: "text-accent-warm" },
};

export default function CoachInsightsEmbed({ insights = [] }) {
  return (
    <Card className="glass">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/15 text-primary">
              <Sparkles className="h-4 w-4" />
            </span>
            Coach insights
          </CardTitle>
          <CardDescription className="mt-1">Proactive guidance from your AI coach.</CardDescription>
        </div>
        <Link
          href="/coach"
          className="flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-accent"
        >
          Open coach <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent>
        {insights.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-sm text-muted-foreground">
              Your AI coach will surface personalized nudges here as you use NovaNest.
            </p>
            <Link
              href="/coach"
              className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-accent"
            >
              Start a conversation <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {insights.map((ins, i) => {
              const meta = KIND_META[ins.kind] ?? KIND_META.nudge;
              const Icon = meta.icon;
              return (
                <motion.li
                  key={ins.id}
                  initial={{ opacity: 0, y: 6 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-start gap-2.5"
                >
                  <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${meta.className}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{ins.title}</p>
                    {ins.body && (
                      <p className="line-clamp-2 text-xs text-muted-foreground">{ins.body}</p>
                    )}
                    <p className="mt-0.5 text-[11px] text-muted-foreground/70">
                      {formatDistanceToNow(new Date(ins.createdAt), { addSuffix: true })}
                      {ins.isRead ? (
                        <span className="ml-1.5 inline-flex items-center gap-0.5 text-accent-warm">
                          <CheckCircle2 className="h-3 w-3" /> read
                        </span>
                      ) : (
                        <span className="ml-1.5 text-primary">new</span>
                      )}
                    </p>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}