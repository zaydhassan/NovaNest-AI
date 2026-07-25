/**
 * Interview Readiness — a focused 0–100 estimate of how ready the user is to
 * walk into an interview *today*, derived from mock-interview performance and
 * quiz depth. Pure function; `actions/career.js` gathers the data.
 *
 * Distinct from the NovaScore `interview` pillar (which rewards volume): this
 * rewards *recent, high-quality* practice and surfaces the sub-metrics the
 * dashboard card visualizes (communication / technical / structure from the
 * denormalized MockInterview fields added in M3, plus quiz accuracy).
 *
 * Server-only.
 */

const clamp = (n) => Math.max(0, Math.min(100, Math.round(n)));
const avg = (xs) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0);

const READINESS_LEVELS = [
  { min: 0, label: "Not ready", blurb: "Run a mock interview to calibrate." },
  { min: 35, label: "Warming up", blurb: "Keep going — a few more sessions will sharpen you." },
  { min: 60, label: "Interview-ready", blurb: "You're prepared to take real interviews." },
  { min: 80, label: "Locked in", blurb: "Strong across the board — go land it." },
];

function levelFor(score) {
  let chosen = READINESS_LEVELS[0];
  for (const l of READINESS_LEVELS) if (score >= l.min) chosen = l;
  return chosen;
}

/**
 * @param {object} input
 * @param {any[]} [input.mocks] - MockInterview rows (need score, communicationScore, technicalDepthScore, structureScore, createdAt)
 * @param {any[]} [input.assessments] - Assessment rows (need quizScore)
 * @param {Date|string} [input.since] - only count mocks/quizzes after this (recent window). Defaults to all.
 * @returns {{ score: number, level: string, levelBlurb: string, subs: { mockScore: number, communication: number, technical: number, structure: number, quizAccuracy: number, sessions: number }, trend: "up"|"down"|"flat"|"none" }}
 */
export function computeInterviewReadiness({ mocks = [], assessments = [], since } = {}) {
  const cutoff = since ? new Date(since).getTime() : 0;

  const recentMocks = mocks.filter(
    (m) => !cutoff || new Date(m.createdAt).getTime() >= cutoff
  );
  const recentAssessments = assessments.filter(
    (a) => !cutoff || new Date(a.createdAt).getTime() >= cutoff
  );

  const mockScores = recentMocks.map((m) => Number(m.score) || 0).filter((n) => n > 0);
  const comms = recentMocks.map((m) => Number(m.communicationScore) || 0).filter((n) => n > 0);
  const tech = recentMocks.map((m) => Number(m.technicalDepthScore) || 0).filter((n) => n > 0);
  const struct = recentMocks.map((m) => Number(m.structureScore) || 0).filter((n) => n > 0);

  const quizScores = recentAssessments
    .map((a) => Number(a.quizScore) || 0)
    .filter((n) => n > 0);

  // Sub-metrics (each 0–100).
  const subs = {
    mockScore: clamp(avg(mockScores)),
    communication: clamp(avg(comms)),
    technical: clamp(avg(tech)),
    structure: clamp(avg(struct)),
    quizAccuracy: clamp(avg(quizScores)),
    sessions: recentMocks.length,
  };

  // Composite: weighted blend. Mock performance dominates once you have mocks;
  // quiz accuracy fills the gap for users who haven't run a mock yet.
  const hasMocks = mockScores.length > 0;
  const score = hasMocks
    ? clamp(
        subs.mockScore * 0.4 +
          subs.communication * 0.2 +
          subs.technical * 0.2 +
          subs.structure * 0.15 +
          subs.quizAccuracy * 0.05
      )
    : clamp(subs.quizAccuracy * 0.7 + Math.min(30, recentAssessments.length * 6) * 0.3);

  // Trend: compare the most recent mock's score to the previous one.
  let trend = "none";
  if (mockScores.length >= 2) {
    const last = mockScores[mockScores.length - 1];
    const prev = mockScores[mockScores.length - 2];
    trend = last > prev + 3 ? "up" : last < prev - 3 ? "down" : "flat";
  }

  const level = levelFor(score);
  return { score, level: level.label, levelBlurb: level.blurb, subs, trend };
}

export { READINESS_LEVELS };