"use client";

import { useState } from "react";
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  PartyPopper,
  Bell,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { nudgeNow, markInsightRead } from "@/actions/coach";
import useFetch from "@/hooks/use-fetch";
import { cn } from "@/lib/utils";

const KIND_META = {
  nudge: { icon: Bell, className: "text-primary" },
  progress: { icon: TrendingUp, className: "text-accent-warm" },
  risk: { icon: AlertTriangle, className: "text-rose-400" },
  recommendation: { icon: Lightbulb, className: "text-accent" },
  celebration: { icon: PartyPopper, className: "text-accent-warm" },
};

export default function InsightFeed({ insights = [], onUpdated }) {
  const [markingId, setMarkingId] = useState(null);
  const { fn: nudgeFn, loading: nudging } = useFetch(nudgeNow);
  const { fn: markFn } = useFetch(markInsightRead);

  const handleNudge = async () => {
    await nudgeFn();
    await onUpdated?.();
  };

  const handleMarkRead = async (id) => {
    setMarkingId(id);
    try {
      await markFn(id);
      await onUpdated?.();
    } finally {
      setMarkingId(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Sparkles className="h-4 w-4 text-primary" />
          Coach insights
        </h3>
        <Button
          size="sm"
          variant="secondary"
          onClick={handleNudge}
          disabled={nudging}
          className="gap-1.5"
        >
          {nudging ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          Nudge me
        </Button>
      </div>

      {insights.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">
            No insights yet. Tap <span className="text-primary">Nudge me</span> for proactive
            guidance based on your recent activity.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {insights.map((ins) => {
            const meta = KIND_META[ins.kind] ?? KIND_META.nudge;
            const Icon = meta.icon;
            return (
              <li
                key={ins.id}
                className={cn(
                  "rounded-xl border p-3 transition-colors",
                  ins.isRead
                    ? "border-border bg-white/[0.02]"
                    : "border-primary/20 bg-primary/[0.04]"
                )}
              >
                <div className="flex items-start gap-2.5">
                  <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", meta.className)} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{ins.title}</p>
                    {ins.body && (
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        {ins.body}
                      </p>
                    )}
                    <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground/70">
                      <span>
                        {formatDistanceToNow(new Date(ins.createdAt), { addSuffix: true })}
                      </span>
                      {!ins.isRead && (
                        <button
                          type="button"
                          onClick={() => handleMarkRead(ins.id)}
                          disabled={markingId === ins.id}
                          className="text-primary hover:text-accent disabled:opacity-50"
                        >
                          mark read
                        </button>
                      )}
                    </div>
                  </div>
                  {ins.isRead && (
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-accent-warm/60" />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}