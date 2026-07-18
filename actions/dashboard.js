"use server";

import { db } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { generateJSON } from "@/lib/ai/gemini";
import { industryInsightsPrompt } from "@/lib/ai/prompts";
import { rateLimit } from "@/lib/rate-limit";
import { AppError, ValidationError } from "@/lib/errors";
import { computeNovaScore } from "@/lib/nova-score";

/**
 * Generate fresh industry insights for a given industry via Gemini.
 * Shared by on-demand generation and the weekly Inngest cron.
 */
export const generateAIInsights = async (industry) => {
  if (!industry || typeof industry !== "string") {
    throw new ValidationError("An industry is required.");
  }
  const insights = await generateJSON(industryInsightsPrompt(industry));
  return insights;
};

export async function getIndustryInsights() {
  const user = await requireUser({ include: { industryInsight: true } });

  // If insights already exist for this industry, return them.
  if (user.industryInsight) {
    return user.industryInsight;
  }

  // Otherwise generate them on demand (rate-limited to protect AI spend).
  rateLimit({ key: `insights:${user.clerkUserId}`, limit: 5, windowMs: 10 * 60_000 });
  const insights = await generateAIInsights(user.industry);

  // Guard against a race where another request created the row first.
  const industryInsight = await db.industryInsight.upsert({
    where: { industry: user.industry },
    update: {
      ...insights,
      lastUpdated: new Date(),
      nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    create: {
      industry: user.industry,
      ...insights,
      nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return industryInsight;
}

/**
 * Gather the data backing the NovaScore and compute it. Also returns the
 * user's gamification stats (streak / XP) and latest weekly digest, so the
 * dashboard can render the readiness + progress block in one round-trip.
 */
export async function getNovaScore() {
  const user = await requireUser({
    select: {
      id: true,
      skills: true,
      xp: true,
      streak: true,
      lastActiveAt: true,
      industry: true,
    },
  });

  const [resume, assessments, coverLetters, applications, insights, digest] =
    await Promise.all([
      db.resume.findUnique({ where: { userId: user.id } }),
      db.assessment.findMany({
        where: { userId: user.id },
        select: { quizScore: true },
      }),
      db.coverLetter.findMany({
        where: { userId: user.id },
        select: { id: true },
      }),
      db.application.findMany({
        where: { userId: user.id },
        select: { status: true },
      }),
      db.industryInsight.findUnique({
        where: { industry: user.industry },
        select: { recommendedSkills: true },
      }),
      db.weeklyDigest.findFirst({
        where: { userId: user.id },
        orderBy: { weekStart: "desc" },
      }),
    ]);

  const nova = computeNovaScore({
    resume,
    assessments,
    coverLetters,
    applications,
    userSkills: user.skills,
    insights,
  });

  return {
    ...nova,
    xp: user.xp,
    streak: user.streak,
    digest: digest ?? null,
  };
}