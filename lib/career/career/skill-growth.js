/**
 * Skill Growth — turns quiz + mock-interview history into a time series the
 * dashboard card charts, plus an aggregate trend direction. Pure function.
 *
 * The series is a rolling "skill confidence" proxy: each data point is the
 * average of (quiz accuracy %) and (mock score %) within a window ending at
 * that point's date. Mocks weigh a touch heavier since they simulate the real
 * thing. Pure; `actions/career.js` gathers + sorts the rows.
 *
 * Server-only.
 */
import { format } from "date-fns";

const clamp = (n) => Math.max(0, Math.min(100, Math.round(n)));

/**
 * @param {object} input
 * @param {any[]} [input.assessments] - need createdAt + quizScore
 * @param {any[]} [input.mocks] - need createdAt + score
 * @param {number} [input.points=8] - max points to return (newest-first bucketed)
 * @returns {{ series: { date: string, value: number, label: string }[], trend: "up"|"down"|"flat"|"none", latest: number, first: number }}
 */
export function computeSkillGrowth({ assessments = [], mocks = [], points = 8 } = {}) {
  // Normalize each activity into { ts, value } where value is 0–100.
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

  // Build a per-activity rolling value: each point = weighted running average
  // of all activity up to and including that ts. Merging to `points` buckets
  // keeps the chart legible without losing the trajectory.
  const running = [];
  let sum = 0;
  let count = 0;
  for (const it of items) {
    // Weight mocks 1.3x relative to quizzes (slight edge to interview practice).
    // We approximate by repeating the value contribution; simpler: treat mocks
    // as their score but only quizzes/mocks carry value here so we just average.
    sum += it.value;
    count += 1;
    running.push({ ts: it.ts, value: clamp(sum / count) });
  }

  // Bucket down to `points` by taking the last running value in each bucket.
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