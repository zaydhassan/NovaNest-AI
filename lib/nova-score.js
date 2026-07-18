/**
 * NovaScore — the composite "career readiness" metric that ties NovaNest's
 * four tools (resume, interview, cover letters, applications) plus market fit
 * into a single 0–100 number with a per-pillar breakdown.
 *
 * Pure function — no DB access. The caller gathers the data and passes it in.
 * Kept here (not in the action) so it can be unit-tested and reused by the
 * weekly digest cron without an extra round-trip.
 */

/**
 * @typedef {{ score: number, breakdown: Record<string, number>, level: string, levelBlurb: string }} NovaScore
 */

const LEVELS = [
  { min: 0, key: "getting-started", label: "Getting started", blurb: "You're at the beginning — let's build out your profile." },
  { min: 26, key: "building", label: "Building momentum", blurb: "Good progress. Keep practicing and applying." },
  { min: 51, key: "job-ready", label: "Job-ready", blurb: "You're in strong shape to start interviewing." },
  { min: 76, key: "standout", label: "Standout candidate", blurb: "Top-tier readiness — you're set to land offers." },
];

function levelFor(score) {
  let chosen = LEVELS[0];
  for (const l of LEVELS) if (score >= l.min) chosen = l;
  return chosen;
}

const clamp = (n) => Math.max(0, Math.min(100, Math.round(n)));

/**
 * Resume pillar — completeness of the saved resume content.
 * Scores presence of each major section.
 */
function resumeScore(resume) {
  if (!resume || !resume.content) return 0;
  const c = resume.content.toLowerCase();
  const sections = [
    "professional summary",
    "skills",
    "work experience",
    "education",
    "projects",
    "@", // contact (email)
  ];
  const hits = sections.filter((s) => c.includes(s)).length;
  // Bonus for an existing ATS score on the resume.
  const atsBonus = resume.atsScore ? Math.min(15, resume.atsScore * 0.15) : 0;
  return clamp((hits / sections.length) * 85 + atsBonus);
}

/**
 * Interview pillar — volume of practice + average quiz score.
 */
function interviewScore(assessments = []) {
  if (!assessments.length) return 0;
  const countPart = Math.min(40, assessments.length * 10);
  const avg =
    assessments.reduce((s, a) => s + (a.quizScore || 0), 0) / assessments.length;
  const scorePart = Math.min(60, avg);
  return clamp(countPart + scorePart);
}

/**
 * Cover-letter pillar — activity volume.
 */
function coverLetterScore(coverLetters = []) {
  return clamp(coverLetters.length * 25);
}

/**
 * Applications pillar — volume + furthest pipeline stage reached.
 */
const STAGE_POINTS = {
  SAVED: 0,
  APPLIED: 12,
  SCREENING: 24,
  INTERVIEW: 37,
  OFFER: 50,
  REJECTED: 0,
};

function applicationsScore(applications = []) {
  if (!applications.length) return 0;
  const countPart = Math.min(50, applications.length * 10);
  const furthest = applications.reduce(
    (best, a) => Math.max(best, STAGE_POINTS[a.status] ?? 0),
    0
  );
  return clamp(countPart + furthest);
}

/**
 * Market-fit pillar — how well the user's skills match the recommended skills
 * for their industry. Falls back to a skills-volume heuristic when no insight
 * is available.
 */
function marketFitScore(userSkills = [], insights = null) {
  if (insights?.recommendedSkills?.length) {
    const set = new Set(userSkills.map((s) => String(s).toLowerCase()));
    const have = insights.recommendedSkills.filter((s) =>
      set.has(String(s).toLowerCase())
    ).length;
    return clamp((have / insights.recommendedSkills.length) * 100);
  }
  return clamp(userSkills.length * 12);
}

// Weighted pillars. Weights sum to 1.
const WEIGHTS = {
  resume: 0.25,
  interview: 0.2,
  coverLetter: 0.15,
  applications: 0.25,
  marketFit: 0.15,
};

/**
 * Compute the NovaScore.
 *
 * @param {{ resume?: any, assessments?: any[], coverLetters?: any[], applications?: any[], userSkills?: string[], insights?: any }} input
 * @returns {NovaScore}
 */
export function computeNovaScore({
  resume,
  assessments = [],
  coverLetters = [],
  applications = [],
  userSkills = [],
  insights = null,
} = {}) {
  const breakdown = {
    resume: resumeScore(resume),
    interview: interviewScore(assessments),
    coverLetter: coverLetterScore(coverLetters),
    applications: applicationsScore(applications),
    marketFit: marketFitScore(userSkills, insights),
  };

  const score = clamp(
    Object.entries(WEIGHTS).reduce(
      (sum, [key, w]) => sum + breakdown[key] * w,
      0
    )
  );

  const level = levelFor(score);
  return { score, breakdown, level: level.label, levelBlurb: level.blurb };
}

export { LEVELS as NOVA_LEVELS };