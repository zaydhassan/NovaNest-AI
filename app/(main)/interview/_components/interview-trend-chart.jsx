"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/site/state-block";
import { Mic, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { getInterviewTrends } from "@/actions/mock-interview";

const TREND_META = {
  up: { icon: TrendingUp, label: "Trending up", className: "text-emerald-500" },
  down: { icon: TrendingDown, label: "Trending down", className: "text-rose-500" },
  flat: { icon: Minus, label: "Holding steady", className: "text-muted-foreground" },
  none: { icon: Minus, label: "Not enough data", className: "text-muted-foreground" },
};

export default function InterviewTrendChart() {
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    getInterviewTrends(12)
      .then((data) => {
        if (alive) setTrends(data);
      })
      .catch(() => {
        if (alive) setTrends(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return (
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/15 text-primary">
              <Mic className="h-4 w-4" />
            </span>
            Interview score trend
          </CardTitle>
          <CardDescription>Mock interview scores + sub-metrics over time.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] shimmer rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  if (!trends || !trends.series?.length) {
    return (
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/15 text-primary">
              <Mic className="h-4 w-4" />
            </span>
            Interview score trend
          </CardTitle>
          <CardDescription>Mock interview scores + sub-metrics over time.</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Mic}
            title="No mock interviews yet"
            description="Run a voice mock interview to start tracking your scores, communication, technical, and structure over time."
            className="max-w-none py-8"
          />
        </CardContent>
      </Card>
    );
  }

  const t = TREND_META[trends.trend] ?? TREND_META.none;
  const TrendIcon = t.icon;

  return (
    <Card className="glass">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/15 text-primary">
              <Mic className="h-4 w-4" />
            </span>
            Interview score trend
          </CardTitle>
          <CardDescription>Mock interview scores + sub-metrics over time.</CardDescription>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge variant="secondary" className={`gap-1 ${t.className}`}>
            <TrendIcon className="h-3 w-3" />
            {t.label}
          </Badge>
          <span className="text-[11px] text-muted-foreground">{trends.count} sessions</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trends.series} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} stroke="hsl(var(--border))" />
              <YAxis domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} stroke="hsl(var(--border))" />
              <Tooltip
                cursor={{ stroke: "hsl(var(--primary))", strokeWidth: 1 }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0].payload;
                  return (
                    <div className="glass-strong rounded-lg p-2 text-xs shadow-glass">
                      <p className="font-medium">{p.date}</p>
                      <p className="text-foreground">Score: {p.score}</p>
                      <p className="text-muted-foreground">Communication: {p.communication}</p>
                      <p className="text-muted-foreground">Technical: {p.technical}</p>
                      <p className="text-muted-foreground">Structure: {p.structure}</p>
                    </div>
                  );
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 11 }}
                iconType="circle"
              />
              <Line type="monotone" dataKey="score" name="Score" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="communication" name="Communication" stroke="hsl(var(--chart-2))" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="technical" name="Technical" stroke="hsl(var(--chart-3))" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="structure" name="Structure" stroke="hsl(var(--chart-4))" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {trends.topImprovement && (
          <p className="mt-3 rounded-lg border border-border bg-background/60 p-3 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Repeated focus area: </span>
            {trends.topImprovement}
          </p>
        )}
      </CardContent>
    </Card>
  );
}