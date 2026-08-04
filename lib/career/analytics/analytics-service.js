import { db } from "@/lib/prisma";
import { computeInterviewTrends } from "@/lib/career/analytics/interview-trends";

export async function getInterviewTrendsData(
  userId,
  { limit = 12, client = db } = {}
) {
  const mocks = await client.mockInterview.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    take: Math.max(2, Math.min(50, limit)),
    select: {
      id: true,
      role: true,
      score: true,
      feedback: true,
      strengths: true,
      improvements: true,
      communicationScore: true,
      technicalDepthScore: true,
      structureScore: true,
      createdAt: true,
    },
  });
  return computeInterviewTrends(mocks);
}

export { computeInterviewTrends };