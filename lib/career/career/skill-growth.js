import { format } from "date-fns";

const clamp = (n) => Math.max(0, Math.min(100, Math.round(n)));

export function computeSkillGrowth({ assessments = [], mocks = [], points = 8 } = {}) {
  const items = [
    ...assessments.map((a) => ({
      ts: new Date(a.createdAt).getTime(),
      value: clamp(Number(a.quizScore) || 0),
    })),
    ...mocks.map((m) => ({
      ts: new Date(m.createdAt).getTime(),
      value: clamp(Number(m.score) || 0),
    })),
  ].filter((x) => Number.isFinite(x.ts) && x.value > 0);

  if (!items.length) {
    return { series: [], trend: "none", latest: 0, first: 0 };
  }

  items.sort((a, b) => a.ts - b.ts);

  const running = [];
  let sum = 0;
  let count = 0;
  for (const it of items) {
    sum += it.value;
    count += 1;
    running.push({ ts: it.ts, value: clamp(sum / count) });
  }

  const series = bucket(running, points).map((b) => ({
    date: format(new Date(b.ts), "dd MMM"),
    value: b.value,
    label: format(new Date(b.ts), "dd MMM yyyy"),
  }));

  const first = series[0]?.value ?? 0;
  const latest = series[series.length - 1]?.value ?? 0;
  const trend =
    series.length >= 2 && latest > first + 2
      ? "up"
      : series.length >= 2 && latest < first - 2
        ? "down"
        : series.length >= 2
          ? "flat"
          : "none";

  return { series, trend, latest, first };
}

function bucket(running, points) {
  if (running.length <= points) return running;
  const step = running.length / points;
  const out = [];
  for (let i = 0; i < points; i++) {
    const idx = Math.min(running.length - 1, Math.floor((i + 1) * step) - 1);
    out.push(running[idx]);
  }
  return out;
}

export { clamp as clampScore };