"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Target, Sparkles, ArrowRight, CheckSquare, Lightbulb } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function TodaysMissionCard({
  goal = null,
  digest = null,
  recommendations = [],
  recommendationInsights = [],
}) {
  const items = [];

  const topRec = recommendations?.[0];
  if (topRec?.skill) {
    items.push({
      icon: Target,
      accent: "text-primary",
      title: `Build ${topRec.skill}`,
      why: topRec.why || "Your top recommended next skill.",
      href: "/learning",
      cta: "Open learning",
    });
  }

  const actionItem = digest?.content?.actionItem;
  if (actionItem) {
    items.push({
      icon: CheckSquare,
      accent: "text-accent-warm",
      title: actionItem,
      why: "This week's priority from your AI digest.",
      href: "/coach",
      cta: "Open coach",
    });
  }

  const recInsight = recommendationInsights?.find((i) => !i.isRead) ?? recommendationInsights?.[0];
  if (recInsight?.title) {
    items.push({
      icon: Lightbulb,
      accent: "text-accent",
      title: recInsight.title,
      why: recInsight.body || "A suggested next move from your AI copilot.",
      href: recInsight.href || "/coach",
      cta: "Act on it",
    });
  }

  return (
    <Card className="glass overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="grid h-7 w-7 place-items-center rounded-lg ring-aurora text-white shadow-glow">
              <Sparkles className="h-4 w-4" />
            </span>
            Today&rsquo;s mission
          </CardTitle>
          <CardDescription className="mt-1">
            Your daily focus — drawn from your goal, this week&rsquo;s digest, and
            what&rsquo;s falling behind.
          </CardDescription>
        </div>
        {goal?.targetRole && (
          <span className="hidden shrink-0 rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground sm:block">
            Goal: {goal.targetRole}
          </span>
        )}
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Target className="h-8 w-8 text-muted-foreground/60" />
            <p className="max-w-sm text-sm text-muted-foreground">
              Complete onboarding and run a few activities — your mission will
              generate from your goal and this week&rsquo;s digest.
            </p>
            <Link
              href="/coach"
              className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-accent"
            >
              Ask your copilot <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {items.slice(0, 3).map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-3 rounded-xl border border-border bg-background/40 p-3 transition-colors hover:border-primary/30"
                >
                  <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${item.accent}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    <p className="line-clamp-2 text-xs text-muted-foreground">{item.why}</p>
                  </div>
                  <Link
                    href={item.href}
                    className="flex shrink-0 items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-accent"
                  >
                    {item.cta} <ArrowRight className="h-3 w-3" />
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