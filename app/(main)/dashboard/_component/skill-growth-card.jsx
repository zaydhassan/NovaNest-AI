"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { TrendingUp, TrendingDown, Minus, LineChart as LineIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function TrendBadge({ trend }) {
  if (trend === "up")
    return (
      <Badge variant="secondary" className="gap-1 text-accent-warm">
        <TrendingUp className="h-3.5 w-3.5" /> Trending up
      </Badge>
    );
  if (trend === "down")
    return (
      <Badge variant="secondary" className="gap-1 text-rose-400">
        <TrendingDown className="h-3.5 w-3.5" /> Trending down
      </Badge>
    );
  if (trend === "flat")
    return (
      <Badge variant="secondary" className="gap-1">
        <Minus className="h-3.5 w-3.5" /> Steady
      </Badge>
    );
  return null;
}

export default function SkillGrowthCard({ growth }) {
  const series = growth?.series ?? [];
  const trend = growth?.trend ?? "none";

  return (
    <Card className="glass">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/15 text-primary">
              <LineIcon className="h-4 w-4" />
            </span>
            Skill growth
          </CardTitle>
          <CardDescription className="mt-1">
            Confidence trend from quizzes + mock interviews.
          </CardDescription>
        </div>
        <TrendBadge trend={trend} />
      </CardHeader>
      <CardContent>
        {series.length < 2 ? (
          <div className="flex h-[200px] items-center justify-center text-center">
            <p className="max-w-xs text-sm text-muted-foreground">
              Run a few quizzes or mock interviews to see your skill growth trend.
            </p>
          </div>
        ) : (
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 5, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="skillGrowthArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  width={32}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 12,
                    color: "hsl(var(--foreground))",
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                  formatter={(v) => [`${v}`, "Confidence"]}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#skillGrowthArea)"
                  dot={{ r: 3, fill: "hsl(var(--primary))" }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}