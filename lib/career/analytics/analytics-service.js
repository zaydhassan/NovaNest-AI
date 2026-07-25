/**
 * Analytics service (M6) — thin server-side aggregation layer that gathers the
 * rows the pure career-engine / interview-trends functions consume. Kept
 * separate from the pure functions so they stay unit-testable and so this file
 * is the only place that touches Prisma. `tx ?? db` join pattern.
 */
import { db } from "@/lib/prisma";
import { computeInterviewTrends } from "@/lib/career/analytics/interview-trends";

/**
 * Pull a user's recent mock-interview rows in the shape computeInterviewTrends
 * expects (denormalized columns preferred). Pass-through to the pure fn.
 */
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