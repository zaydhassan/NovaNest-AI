"use server";

import { db } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { generateJSON } from "@/lib/ai/gemini";
import { industryInsightsPrompt } from "@/lib/ai/prompts";
import { rateLimit } from "@/lib/rate-limit";
import { AppError, ValidationError } from "@/lib/errors";
import { computeNovaScore } from "@/lib/nova-score";

export const generateAIInsights = async (industry) => {
  if (!industry || typeof industry !== "string") {
    throw new ValidationError("An industry is required.");
  }
  const insights = await generateJSON(industryInsightsPrompt(industry));
  return insights;
};

export async function getIndustryInsights() {
  const user = await requireUser({ include: { industryInsight: true } });
  const existing = user.industryInsight;

  if (existing && existing.nextUpdate && new Date(existing.nextUpdate) > new Date()) {
    return existing;
  }

  try {
    rateLimit({ key: `insights:${user.clerkUserId}`, limit: 5, windowMs: 10 * 60_000 });
    const insights = await generateAIInsights(user.industry);

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
  } catch (e) {
    if (existing) {
      console.error("[NovaNest] industry insights refresh failed, serving stale:", e?.message);
      return existing;
    }
    throw e;
  }
}

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