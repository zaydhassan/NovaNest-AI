import { db } from "@/lib/prisma";
import { recommendNextTopics } from "@/lib/career/recommendations/next-topics";
import { companyContextFromProfile } from "@/lib/career/dream-company/company-context";

const norm = (s) => String(s ?? "").toLowerCase().trim();

export async function getRecommendedTopics(userId, client = db) {
  const [goal, topics, user, mocks] = await Promise.all([
    client.careerGoal.findFirst({
      where: { userId, status: "active" },
      orderBy: { updatedAt: "desc" },
      select: { targetRole: true, targetLevel: true },
    }),
    client.learningTopic.findMany({
      where: { userId },
      select: { skill: true, status: true },
    }),
    client.user.findUnique({
      where: { id: userId },
      select: { id: true, industry: true, skills: true, targetCompany: true },
    }),
    client.mockInterview.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { improvements: true },
    }),
  ]);

  const insight = user?.industry
    ? await client.industryInsight.findUnique({
        where: { industry: user.industry },
        select: { topSkills: true, recommendedSkills: true },
      })
    : null;

  const companyProfile = user?.targetCompany
    ? await client.companyProfile.findUnique({
        where: { company: user.targetCompany },
        select: {
          displayName: true,
          topSkills: true,
          recommendedSkills: true,
          values: true,
          bar: true,
          interviewThemes: true,
          famousQuestions: true,
        },
      })
    : null;

  const weaknessCounts = new Map();
  for (const m of mocks) {
    for (const imp of (m.improvements || []).slice(0, 4)) {
      const key = norm(imp).slice(0, 40);
      if (!key) continue;
      weaknessCounts.set(key, (weaknessCounts.get(key) ?? 0) + 1);
    }
  }
  const weaknesses = Array.from(weaknessCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([k]) => k);

  return recommendNextTopics({
    goal: goal ?? null,
    skills: user?.skills ?? [],
    memorySkills: [],
    weaknesses,
    existingTopics: topics.map((t) => t.skill),
    recommendedSkills: insight?.recommendedSkills ?? [],
    topSkills: insight?.topSkills ?? [],
    company: companyContextFromProfile(companyProfile),
  });
}

export { recommendNextTopics };