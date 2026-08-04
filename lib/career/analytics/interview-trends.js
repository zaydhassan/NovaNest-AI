import { parseFeedback } from "@/lib/career/memory/interview-memory";
import { format } from "date-fns";

const clamp = (n) => Math.max(0, Math.min(100, Math.round(n)));
const avg = (xs) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0);

export function computeInterviewTrends(mocks = []) {
  const sorted = [...mocks].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  );

  if (!sorted.length) {
    return {
      series: [],
      averages: { score: 0, communication: 0, technical: 0, structure: 0 },
      trend: "none",
      topImprovement: null,
      count: 0,
    };
  }

  const points = sorted.map((m) => {
    const f = parseFeedback(m) || {};
    return {
      date: format(new Date(m.createdAt), "dd MMM"),
      score: clamp(Number(m.score ?? f.score ?? 0)),
      communication: clamp(Number(f.communication ?? m.communicationScore ?? 0)),
      technical: clamp(Number(f.technicalDepth ?? m.technicalDepthScore ?? 0)),
      structure: clamp(Number(f.structure ?? m.structureScore ?? 0)),
      improvements: Array.isArray(m.improvements) && m.improvements.length
        ? m.improvements
        : Array.isArray(f.improvements) ? f.improvements : [],
    };
  });

  const averages = {
    score: clamp(avg(points.map((p) => p.score))),
    communication: clamp(avg(points.map((p) => p.communication))),
    technical: clamp(avg(points.map((p) => p.technical))),
    structure: clamp(avg(points.map((p) => p.structure))),
  };

  let trend = "none";
  if (points.length >= 2) {
    const last = points[points.length - 1].score;
    const first = points[0].score;
    trend = last > first + 3 ? "up" : last < first - 3 ? "down" : "flat";
  }

  const counts = new Map();
  for (const p of points.slice(-6)) {
    for (const imp of p.improvements.slice(0, 4)) {
      const key = String(imp).toLowerCase().slice(0, 60);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  let topImprovement = null;
  let topCount = 0;
  for (const [k, c] of counts) {
    if (c > topCount) {
      topCount = c;
      topImprovement = k;
    }
  }
  if (topCount < 2) topImprovement = null;

  return { series: points, averages, trend, topImprovement, count: points.length };
}