/**
 * gatherChatContextData (M5) — the per-turn DB reads the Coordinator's agents
 * need: recent mock interviews, a resume excerpt, the application list, and the
 * quick metrics the analytics agent surfaces. Server-only (touches the DB), no
 * "use server" directive so the streaming route can import it directly.
 *
 * Kept cheap on purpose: each query selects only the fields the agents cite,
 * and the resume excerpt is capped. Called once per sendMessage turn.
 */
import { db } from "@/lib/prisma";
import { computeHealthScore } from "@/lib/career/career/career-engine";
import { computeInterviewReadiness } from "@/lib/career/career/readiness";
import { memoryStats } from "@/lib/career/memory/memory-service";
import { getRecommendedTopics } from "@/lib/career/recommendations/recommendation-service";

const ellipsize = (s, n = 600) =>
  String(s ?? "").length > n ? String(s).slice(0, n) + "…" : String(s ?? "");

/**
 * @param {{ id: string, industry?: string, experience?: number, skills?: string[], bio?: string }} user
 */
export async function gatherChatContextData(user) {
  if (!user?.id) return {};

  const [resume, mocks, applications, assessments, coverLetters, insights, memStats, goal] =
    await Promise.all([
      db.resume.findUnique({
        where: { userId: user.id },
        select: { id: true, content: true, atsScore: true },
      }),
      db.mockInterview.findMany({
        where: { userId: user.id },
        select: {
          role: true,
          score: true,
          communicationScore: true,
          technicalDepthScore: true,
          structureScore: true,
          strengths: true,
          improvements: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      db.application.findMany({
        where: { userId: user.id },
        select: { id: true, company: true, role: true, status: true, createdAt: true },
        orderBy: { updatedAt: "desc" },
        take: 10,
      }),
      db.assessment.findMany({
        where: { userId: user.id },
        select: { quizScore: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      db.coverLetter.findMany({
        where: { userId: user.id },
        select: { id: true },
      }),
      db.industryInsight.findUnique({
        where: { industry: user.industry },
        select: { recommendedSkills: true },
      }),
      memoryStats(user.id),
      db.careerGoal.findFirst({
        where: { userId: user.id, status: "active" },
        orderBy: { updatedAt: "desc" },
        select: { targetRole: true, targetLevel: true, timeframe: true },
      }),
    ]);

  // Recommended next topics (M9) — grounds the learning agent when the user
  // asks "what should I learn next". Self-contained; best-effort (empty on err).
  const recommendedTopics = await getRecommendedTopics(user.id).catch((e) => {
    console.error("[NovaNest] getRecommendedTopics in chat context:", e?.message);
    return [];
  });

  const skillSet = new Set(
    (user.skills || []).map((s) => String(s).toLowerCase()).filter(Boolean)
  );

  const health = computeHealthScore({
    resume,
    assessments,
    coverLetters,
    applications,
    userSkills: user.skills,
    insights,
    mocks,
    distinctSkills: skillSet.size,
    memoryStats: memStats,
  });

  const readiness = computeInterviewReadiness({
    mocks: mocks.map((m) => ({ ...m, createdAt: m.createdAt })),
    assessments,
  });

  const scoredMocks = mocks.filter((m) => Number(m.score) > 0);
  const avgMock = scoredMocks.length
    ? Math.round(scoredMocks.reduce((s, m) => s + Number(m.score), 0) / scoredMocks.length)
    : null;

  const offers = applications.filter((a) => a.status === "OFFER").length;

  return {
    extras: {
      healthScore: health.score,
      healthLevel: health.level,
      readinessScore: readiness.score,
      readinessLevel: readiness.level,
    },
    metrics: {
      healthScore: health.score,
      healthLevel: health.level,
      readinessScore: readiness.score,
      readinessLevel: readiness.level,
      mockCount: mocks.length,
      avgMock,
      applicationCount: applications.length,
      offerCount: offers,
      streak: null, // set by caller if cheap; left null to avoid extra read
    },
    recentMocks: mocks.length
      ? mocks
          .slice(0, 3)
          .map(
            (m) =>
              `${m.role} (${m.score ?? "-"}/100)${m.improvements?.length ? ` — to improve: ${m.improvements.slice(0, 2).join("; ")}` : ""}`
          )
          .join(" | ")
      : null,
    resumeSummary: resume?.content ? ellipsize(resume.content, 600) : null,
    applicationsSummary: applications.length
      ? applications.map((a) => `${a.company}/${a.role} [${a.status}]`).join(", ")
      : null,
    goal: goal
      ? {
          targetRole: goal.targetRole,
          targetLevel: goal.targetLevel,
          timeframe: goal.timeframe,
        }
      : null,
    recommendedTopics: (recommendedTopics || []).slice(0, 8),
  };
}