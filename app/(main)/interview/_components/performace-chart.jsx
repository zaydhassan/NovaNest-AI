"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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
import { format } from "date-fns";
import { TrendingUp } from "lucide-react";

export default function PerformanceChart({ assessments }) {
  const { chartData, trend } = useMemo(() => {
    const list = (assessments ?? []).map((a) => ({
      date: format(new Date(a.createdAt), "MMM dd"),
      score: a.quizScore,
    }));
    let trend = 0;
    if (list.length >= 2) {
      trend = list[list.length - 1].score - list[0].score;
    }
    return { chartData: list, trend };
  }, [assessments]);

  if (!chartData.length) {
    return (
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-xl font-bold tracking-tight text-foreground md:text-2xl">Performance trend</CardTitle>
          <CardDescription>Your quiz scores over time</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={TrendingUp}
            title="No quiz history yet"
            description="Complete a mock interview or quiz to start tracking your performance over time."
            className="max-w-none py-8"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-xl font-bold tracking-tight text-foreground md:text-2xl">Performance trend</CardTitle>
          <CardDescription>Your quiz scores over time</CardDescription>
        </div>
        {chartData.length >= 2 && (
          <Badge variant="secondary" className="gap-1">
            <TrendingUp className={`h-3 w-3 ${trend >= 0 ? "text-emerald-500" : "text-rose-500"}`} />
            {trend >= 0 ? "+" : ""}
            {trend.toFixed(1)} pts
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="scoreArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} stroke="hsl(var(--border))" />
              <YAxis domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} stroke="hsl(var(--border))" />
              <Tooltip
                cursor={{ stroke: "hsl(var(--primary))", strokeWidth: 1 }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="glass-strong rounded-lg p-2 text-xs shadow-glass">
                      <p className="font-medium">{payload[0].payload.date}</p>
                      <p className="text-muted-foreground">Score: {payload[0].value}%</p>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2.5}
                fill="url(#scoreArea)"
                dot={{ r: 3, fill: "hsl(var(--chart-1))", strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}