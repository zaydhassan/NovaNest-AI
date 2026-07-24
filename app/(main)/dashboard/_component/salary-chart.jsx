"use client";

import {
  BarChart,
  Bar,
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

function GlassTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-lg p-3 text-xs shadow-glass">
      <p className="mb-1 font-medium text-foreground">{label}</p>
      {payload.map((item) => (
        <p key={item.name} className="flex items-center gap-1.5 text-muted-foreground">
          <span className="h-2 w-2 rounded-full" style={{ background: item.color || item.fill }} />
          {item.name}: <span className="font-medium text-foreground">{formatter ? formatter(item.value) : item.value}</span>
        </p>
      ))}
    </div>
  );
}

/**
 * Salary ranges bar chart. Extracted from DashboardView so recharts can be
 * code-split (loaded in its own chunk after hydration instead of bloating the
 * dashboard route's First Load JS).
 */
export default function SalaryChart({ salaryRanges }) {
  const salaryData = (salaryRanges ?? []).map((range) => ({
    name: range.role,
    min: Math.round(range.min / 1000),
    max: Math.round(range.max / 1000),
    median: Math.round(range.median / 1000),
  }));

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle>Salary ranges by role</CardTitle>
        <CardDescription>Min, median, and max (in thousands USD)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salaryData} margin={{ top: 8, right: 8, left: -16, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                stroke="hsl(var(--border))"
                interval={0}
                angle={-20}
                textAnchor="end"
                height={50}
              />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} stroke="hsl(var(--border))" />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
                content={<GlassTooltip formatter={(v) => `$${v}K`} />}
              />
              <Bar dataKey="min" fill="hsl(var(--chart-1))" name="Min" radius={[6, 6, 0, 0]} />
              <Bar dataKey="median" fill="hsl(var(--chart-2))" name="Median" radius={[6, 6, 0, 0]} />
              <Bar dataKey="max" fill="hsl(var(--chart-3))" name="Max" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}