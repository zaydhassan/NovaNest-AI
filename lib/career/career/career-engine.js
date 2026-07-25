/**
 * Career Engine — the Career Health Score: a superset of the NovaScore that
 * folds in the Career OS pillars (learning activity + long-term memory
 * richness) on top of the existing readiness composite.
 *
 * Design rule (from the approved plan): Career Health "extends NovaScore, never
 * lower". We honor that by keeping the NovaScore as the floor and layering the
 * two new pillars as non-negative bonuses — so a user with no memory/learning
 * history sees Career Health == NovaScore, and any memory/learning activity
 * only ever lifts it.
 *
 * Pure functions — no DB access. `actions/career.js` gathers the data and passes
 * it in (mirrors `lib/nova-score.js`).
 *
 * Server-only (re-exported via `@/lib/career`).
 */
import { computeNovaScore } from "@/lib/nova-score";

const clamp = (n) => Math.max(0, Math.min(100, Math.round(n)));

/**
 * Learning pillar — volume + quality of practice across quizzes and mock
 * interviews, plus breadth of distinct skills practiced, plus mastery of
 * tracked LearningTopics (M9). The tracked-topics component rewards topics the
 * user has actively moved toward `learned`, so marking a topic learned on the
 * /learning board visibly lifts Career Health (the M9 acceptance criterion).
 *
 * @param {{ assessments?: any[], mocks?: any[], distinctSkills?: number, learningTopics?: any[] }} input
 * @returns {number} 0–100
 */
export function learningPillar({
  assessments = [],
  mocks = [],
  distinctSkills = 0,
  learningTopics = [],
} = {}) {
  // Quiz volume (cap 30) + average quiz score (cap 30).
  const quizCountPart = Math.min(30, assessments.length * 7.5);
  const avgQuiz =
    assessments.length && assessments.some((a) => Number(a.quizScore) > 0)
      ? assessments.reduce((s, a) => s + (Number(a.quizScore) || 0), 0) /
        Math.max(1, assessments.filter((a) => Number(a.quizScore) || 0).length)
      : 0;
  const quizScorePart = Math.min(30, avgQuiz);

  // Mock interview volume (cap 25) + average mock score (cap 10).
  const mockCountPart = Math.min(25, mocks.length * 8);
  const scoredMocks = mocks.filter((m) => Number(m.score) > 0);
  const avgMock = scoredMocks.length
    ? scoredMocks.reduce((s, m) => s + (Number(m.score) || 0), 0) / scoredMocks.length
    : 0;
  const mockScorePart = Math.min(10, avgMock / 10);

  // Breadth of distinct skills the user has practiced/touched (cap 5).
  const breadthPart = Math.min(5, distinctSkills);

  // Tracked-topic mastery (M9). Each `learned` topic is worth up to 3 points;
  // `learning`/`needs_review` topics contribute partial proficiency. Capped
  // at 12 so the pillar can't be inflated by adding many `todo` topics.
  const topicPart = Math.min(
    12,
    learningTopics.reduce((sum, t) => {
      const p = Number(t?.proficiency) || 0;
      const status = t?.status;
      if (status === "learned") return sum + 3;
      if (status === "learning" || status === "needs_review") return sum + Math.min(2, p * 2);
      return sum; // todo contributes nothing until practiced
    }, 0)
  );

  return clamp(
    quizCountPart + quizScorePart + mockCountPart + mockScorePart + breadthPart + topicPart
  );
}

/**
 * Memory pillar — richness of the long-term memory store. Rewards breadth
 * (distinct memory types captured) more than raw volume, since one
 * identity memory + five skill memories tells the OS more than six generic
 * notes. Degrades to 0 for a brand-new user with no memories yet.
 *
 * @param {{ total: number, byType: Record<string, number> }} stats
 * @returns {number} 0–100
 */
export function memoryPillar({ total = 0, byType = {} } = {}) {
  if (!total) return 0;
  const typeCount = Object.keys(byType).length;
  const breadthPart = Math.min(60, typeCount * 8); // up to ~7-8 types → cap
  const volumePart = Math.min(40, total * 2); // 20 memories → full volume
  return clamp(breadthPart + volumePart);
}

const HEALTH_LEVELS = [
  { min: 0, key: "getting-started", label: "Getting started", blurb: "Build out your profile to grow your career health." },
  { min: 26, key: "building", label: "Building momentum", blurb: "Good progress — keep practicing and applying." },
  { min: 51, key: "job-ready", label: "Job-ready", blurb: "You're in strong shape to interview and land roles." },
  { min: 76, key: "standout", label: "Standout candidate", blurb: "Top-tier career health — you're set to land offers." },
];

function healthLevel(score) {
  let chosen = HEALTH_LEVELS[0];
  for (const l of HEALTH_LEVELS) if (score >= l.min) chosen = l;
  return chosen;
}

/**
 * Compute the Career Health Score.
 *
 * Returns the NovaScore payload (so callers don't recompute it) plus the two
 * new pillar values, the blended Career Health score, and a level/label. The
 * Career Health score is the NovaScore floor + weighted bonuses from the
 * learning + memory pillars (so it is *never lower* than NovaScore).
 *
 * @param {object} input - same shape as computeNovaScore plus learning/memory data
 * @param {any} [input.resume]
 * @param {any[]} [input.assessments]
 * @param {any[]} [input.coverLetters]
 * @param {any[]} [input.applications]
 * @param {string[]} [input.userSkills]
 * @param {any} [input.insights]
 * @param {any[]} [input.mocks]
 * @param {number} [input.distinctSkills]
 * @param {{ total: number, byType: Record<string, number> }} [input.memoryStats]
 * @param {any[]} [input.learningTopics] - tracked LearningTopic rows (M9)
 * @returns {{ nova: object, score: number, breakdown: object, learning: number, memory: number, level: string, levelBlurb: string, delta: number }}
 */
export function computeHealthScore(input = {}) {
  const {
    mocks = [],
    distinctSkills = 0,
    memoryStats = { total: 0, byType: {} },
    learningTopics = [],
    ...novaInput
  } = input;

  // NovaScore composite (floor).
  const nova = computeNovaScore(novaInput);

  const learning = learningPillar({
    assessments: novaInput.assessments,
    mocks,
    distinctSkills,
    learningTopics,
  });
  const memory = memoryPillar(memoryStats);

  // Bonuses are non-negative and capped so Career Health can only add to the
  // NovaScore floor. learningBonus up to +8, memoryBonus up to +5 → max +13
  // before the 100 clamp, keeping the composite meaningful.
  const learningBonus = Math.round(learning * 0.08);
  const memoryBonus = Math.round(memory * 0.05);
  const score = clamp(nova.score + learningBonus + memoryBonus);

  const level = healthLevel(score);
  return {
    nova,
    score,
    breakdown: { ...nova.breakdown, learning, memory },
    learning,
    memory,
    level: level.label,
    levelBlurb: level.blurb,
    delta: score - nova.score,
  };
}

export { HEALTH_LEVELS as CAREER_HEALTH_LEVELS };