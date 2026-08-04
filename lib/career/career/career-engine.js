import { computeNovaScore } from "@/lib/nova-score";

const clamp = (n) => Math.max(0, Math.min(100, Math.round(n)));

export function learningPillar({
  assessments = [],
  mocks = [],
  distinctSkills = 0,
  learningTopics = [],
} = {}) {
  const quizCountPart = Math.min(30, assessments.length * 7.5);
  const avgQuiz =
    assessments.length && assessments.some((a) => Number(a.quizScore) > 0)
      ? assessments.reduce((s, a) => s + (Number(a.quizScore) || 0), 0) /
        Math.max(1, assessments.filter((a) => Number(a.quizScore) || 0).length)
      : 0;
  const quizScorePart = Math.min(30, avgQuiz);

  const mockCountPart = Math.min(25, mocks.length * 8);
  const scoredMocks = mocks.filter((m) => Number(m.score) > 0);
  const avgMock = scoredMocks.length
    ? scoredMocks.reduce((s, m) => s + (Number(m.score) || 0), 0) / scoredMocks.length
    : 0;
  const mockScorePart = Math.min(10, avgMock / 10);

  const breadthPart = Math.min(5, distinctSkills);

  const topicPart = Math.min(
    12,
    learningTopics.reduce((sum, t) => {
      const p = Number(t?.proficiency) || 0;
      const status = t?.status;
      if (status === "learned") return sum + 3;
      if (status === "learning" || status === "needs_review") return sum + Math.min(2, p * 2);
      return sum;
    }, 0)
  );

  return clamp(
    quizCountPart + quizScorePart + mockCountPart + mockScorePart + breadthPart + topicPart
  );
}

export function memoryPillar({ total = 0, byType = {} } = {}) {
  if (!total) return 0;
  const typeCount = Object.keys(byType).length;
  const breadthPart = Math.min(60, typeCount * 8);
  const volumePart = Math.min(40, total * 2);
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

export function computeHealthScore(input = {}) {
  const {
    mocks = [],
    distinctSkills = 0,
    memoryStats = { total: 0, byType: {} },
    learningTopics = [],
    ...novaInput
  } = input;

  const nova = computeNovaScore(novaInput);

  const learning = learningPillar({
    assessments: novaInput.assessments,
    mocks,
    distinctSkills,
    learningTopics,
  });
  const memory = memoryPillar(memoryStats);

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