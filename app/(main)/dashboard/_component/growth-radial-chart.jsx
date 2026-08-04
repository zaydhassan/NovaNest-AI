"use client";

import {
  RadialBar,
  RadialBarChart,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function GrowthRadialChart({ growthRate }) {
  const radialData = [{ name: "growth", value: Math.min(100, Math.max(0, growthRate)) }];

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle>Growth rate</CardTitle>
        <CardDescription>Projected industry growth</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              innerRadius="70%"
              outerRadius="100%"
              data={radialData}
              startAngle={90}
              endAngle={-270}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
              <RadialBar
                background={{ fill: "hsl(var(--muted))" }}
                dataKey="value"
                cornerRadius={20}
                fill="hsl(var(--chart-1))"
              />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-extrabold">{growthRate.toFixed(1)}%</span>
            <span className="text-xs text-muted-foreground">annual growth</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}