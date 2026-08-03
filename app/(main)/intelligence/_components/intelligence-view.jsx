"use client";

import dynamic from "next/dynamic";
import {
  Activity,
  FileText,
  GraduationCap,
  Rocket,
  KanbanSquare,
  LineChart as LineIcon,
  CalendarClock,
  Zap,
  Sparkles,
} from "lucide-react";
import { RevealStagger, RevealItem } from "@/components/site/reveal";
import { EmptyState } from "@/components/site/state-block";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// The metric card uses recharts — code-split it so the page's First Load JS
// stays small (same convention as dashboard-view.jsx).
const MetricCard = dynamic(() => import("./metric-card"), {
  ssr: false,
  loading: () => <div className="h-[420px] shimmer rounded-2xl" />,
});

function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-2 pt-2">
      <span className="h-1.5 w-1.5 rounded-full ring-aurora" />
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {children}
      </h2>
    </div>
  );
}

// Metric → { icon, accent } metadata. Accents use CSS vars so they stay on-brand.
const READINESS = [
  { key: "careerHealth", icon: Activity, accent: "hsl(var(--primary))" },
  { key: "resume", icon: FileText, accent: "hsl(var(--chart-1))" },
  { key: "interviewReadiness", icon: GraduationCap, accent: "hsl(var(--chart-2))" },
  { key: "skillGrowth", icon: LineIcon, accent: "hsl(var(--chart-3))" },
];

const MOMENTUM = [
  { key: "learningVelocity", icon: Rocket, accent: "hsl(var(--chart-4))" },
  { key: "applicationSuccessRate", icon: KanbanSquare, accent: "hsl(var(--accent))" },
  { key: "consistency", icon: CalendarClock, accent: "hsl(var(--accent-warm))" },
  { key: "productivity", icon: Zap, accent: "hsl(var(--primary))" },
];

/**
 * IntelligenceView — renders the 8 Career Intelligence metrics in two sections
 * (Readiness + Momentum). Each metric card carries its score, Why/How/What
 * explanation, and supporting evidence. A header strip summarizes the
 * strongest metric and the one to focus on.
 */
export default function IntelligenceView({ snapshot }) {
  if (!snapshot || !snapshot.metrics) {
    return (
      <EmptyState
        title="Career Intelligence unavailable"
        description="We couldn't load your metrics right now. Please try again in a moment."
        icon={Sparkles}
      />
    );
  }

  const metrics = snapshot.metrics;

  // Derive the strongest + weakest metric labels from the 8 scores.
  const ranked = Object.values(metrics)
    .map((m) => ({ label: m.label, score: m.score }))
    .sort((a, b) => b.score - a.score);
  const top = ranked[0];
  const bottom = ranked[ranked.length - 1];

  return (
    <div className="flex flex-col gap-5">
      {/* Summary strip */}
      <RevealStagger className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <RevealItem>
          <Card className="glass">
            <CardContent className="flex items-center gap-3 p-4">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-500/15 text-emerald-500">
                <Activity className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Strongest area
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {top?.label} <span className="text-muted-foreground">({top?.score}/100)</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </RevealItem>
        <RevealItem>
          <Card className="glass">
            <CardContent className="flex items-center gap-3 p-4">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-amber-500/15 text-amber-500">
                <Zap className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Focus next
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {bottom?.label} <span className="text-muted-foreground">({bottom?.score}/100)</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </RevealItem>
      </RevealStagger>

      <SectionLabel>Readiness</SectionLabel>
      <RevealStagger className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {READINESS.map(({ key, icon, accent }) => (
          <RevealItem key={key}>
            <MetricCard metric={metrics[key]} icon={icon} accent={accent} />
          </RevealItem>
        ))}
      </RevealStagger>

      <SectionLabel>Momentum</SectionLabel>
      <RevealStagger className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {MOMENTUM.map(({ key, icon, accent }) => (
          <RevealItem key={key}>
            <MetricCard metric={metrics[key]} icon={icon} accent={accent} />
          </RevealItem>
        ))}
      </RevealStagger>

      {snapshot.computedAt && (
        <p className="pt-2 text-center text-[11px] text-muted-foreground">
          Computed {new Date(snapshot.computedAt).toLocaleString()} · scores are
          deterministic — every number is backed by the evidence listed on its card.
        </p>
      )}
    </div>
  );
}