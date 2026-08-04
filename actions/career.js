"use server";

import { db } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import {
  NotFoundError,
  ValidationError,
  withErrorHandling,
} from "@/lib/errors";
import { bumpActivity } from "@/lib/gamify";
import { createNotification } from "@/lib/notifications";
import { careerGoalSchema } from "@/lib/schemas";
import { computeHealthScore } from "@/lib/career/career/career-engine";
import { computeInterviewReadiness } from "@/lib/career/career/readiness";
import { computeSkillGrowth } from "@/lib/career/career/skill-growth";
import { memoryStats } from "@/lib/career/memory/memory-service";
import { listTimeline } from "@/lib/career/timeline/timeline-engine";
import { fromGoal } from "@/lib/career/memory/memory-extractors";
import { revalidatePath } from "next/cache";

export const getCareerHealth = withErrorHandling(async function getCareerHealth() {
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

  const [resume, assessments, coverLetters, applications, insights, digest, mocks, memStats, topics] =
    await Promise.all([
      db.resume.findUnique({ where: { userId: user.id }, select: { id: true, content: true, atsScore: true } }),
      db.assessment.findMany({
        where: { userId: user.id },
        select: { quizScore: true, createdAt: true, category: true },
        orderBy: { createdAt: "asc" },
      }),
      db.coverLetter.findMany({ where: { userId: user.id }, select: { id: true } }),
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
      db.mockInterview.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          score: true,
          communicationScore: true,
          technicalDepthScore: true,
          structureScore: true,
          createdAt: true,
          strengths: true,
          improvements: true,
        },
        orderBy: { createdAt: "asc" },
      }),
      memoryStats(user.id),
      db.learningTopic.findMany({
        where: { userId: user.id },
        select: { id: true, status: true, proficiency: true },
      }),
    ]);

  const skillSet = new Set(
    (user.skills || []).map((s) => String(s).toLowerCase()).filter(Boolean)
  );
  const distinctSkills = skillSet.size;

  const health = computeHealthScore({
    resume,
    assessments,
    coverLetters,
    applications,
    userSkills: user.skills,
    insights,
    mocks,
    distinctSkills,
    memoryStats: memStats,
    learningTopics: topics,
  });

  const payload = {
    ...health,
    nova: { ...health.nova, xp: user.xp, streak: user.streak, digest: digest ?? null },
  };

  db.user
    .update({
      where: { id: user.id },
      data: {
        careerHealthScore: {
          score: health.score,
          level: health.level,
          breakdown: health.breakdown,
          learning: health.learning,
          memory: health.memory,
          delta: health.delta,
          computedAt: new Date().toISOString(),
        },
      },
    })
    .catch((e) => console.error("[NovaNest] careerHealthScore cache:", e?.message));

  return payload;
}, "Couldn't load your Career Health. Please try again.");

export const getReadiness = withErrorHandling(async function getReadiness() {
  const user = await requireUser({ select: { id: true } });

  const since = new Date(Date.now() - 6 * 7 * 24 * 60 * 60 * 1000);

  const [mocks, assessments] = await Promise.all([
    db.mockInterview.findMany({
      where: { userId: user.id },
      select: {
        score: true,
        communicationScore: true,
        technicalDepthScore: true,
        structureScore: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    db.assessment.findMany({
      where: { userId: user.id },
      select: { quizScore: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return computeInterviewReadiness({ mocks, assessments, since });
}, "Couldn't load your interview readiness. Please try again.");

export const getSkillGrowth = withErrorHandling(async function getSkillGrowth() {
  const user = await requireUser({ select: { id: true } });

  const [assessments, mocks] = await Promise.all([
    db.assessment.findMany({
      where: { userId: user.id },
      select: { quizScore: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    db.mockInterview.findMany({
      where: { userId: user.id },
      select: { score: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return computeSkillGrowth({ assessments, mocks });
}, "Couldn't load your skill growth. Please try again.");

export const getRecentTimeline = withErrorHandling(async function getRecentTimeline(limit = 6) {
  const user = await requireUser({ select: { id: true } });
  return listTimeline({ userId: user.id, limit: Math.min(20, Math.max(1, Number(limit) || 6)) });
}, "Couldn't load your timeline. Please try again.");

export const getRecentCoachInsights = withErrorHandling(
  async function getRecentCoachInsights(limit = 4) {
    const user = await requireUser({ select: { id: true } });
    return db.coachInsight.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: Math.min(10, Math.max(1, Number(limit) || 4)),
      select: {
        id: true,
        kind: true,
        title: true,
        body: true,
        severity: true,
        href: true,
        isRead: true,
        createdAt: true,
      },
    });
  },
  "Couldn't load your coach insights. Please try again."
);


export const setCareerGoal = withErrorHandling(async function setCareerGoal(data) {
  const user = await requireUser({ select: { id: true, clerkUserId: true } });
  rateLimit({ key: `goal-set:${user.clerkUserId}`, limit: 10, windowMs: 10 * 60_000 });

  const parsed = careerGoalSchema.safeParse(data);
  if (!parsed.success) {
    throw new ValidationError(
      parsed.error.issues?.[0]?.message ?? "Invalid goal."
    );
  }
  const { targetRole, targetLevel, timeframe, rationale } = parsed.data;

  const goal = await db.$transaction(async (tx) => {
    await tx.careerGoal.updateMany({
      where: { userId: user.id, status: "active" },
      data: { status: "retired" },
    });
    return tx.careerGoal.create({
      data: {
        userId: user.id,
        targetRole,
        targetLevel: targetLevel || null,
        timeframe: timeframe || null,
        rationale: rationale || null,
        status: "active",
      },
    });
  });

  fromGoal(user.id, goal).catch((e) =>
    console.error("[NovaNest] fromGoal memory:", e?.message)
  );
  bumpActivity(user.id, "goal_set").catch((e) =>
    console.error("[NovaNest] bumpActivity goal_set:", e?.message)
  );
  createNotification(user.id, {
    type: "coach_nudge",
    title: "Career goal set",
    body: `Targeting ${targetRole}${targetLevel ? ` (${targetLevel})` : ""}. Your learning recommendations now reflect this.`,
    href: "/learning",
    data: { targetRole, targetLevel: targetLevel ?? null },
  }).catch((e) => console.error("[NovaNest] goal_set notify:", e?.message));

  revalidatePath("/learning");
  revalidatePath("/dashboard");
  return goal;
}, "Couldn't save your career goal. Please try again.");

export const getCareerGoal = withErrorHandling(async function getCareerGoal() {
  const user = await requireUser({ select: { id: true } });
  const active = await db.careerGoal.findFirst({
    where: { userId: user.id, status: "active" },
    orderBy: { updatedAt: "desc" },
  });
  return active;
}, "Couldn't load your career goal. Please try again.");

export const retireCareerGoal = withErrorHandling(
  async function retireCareerGoal(id, status = "retired") {
    const user = await requireUser({ select: { id: true } });
    if (!id) throw new ValidationError("Goal id is required.");
    if (status !== "retired" && status !== "achieved") {
      throw new ValidationError("Invalid goal status.");
    }

    const owned = await db.careerGoal.findFirst({
      where: { id, userId: user.id },
      select: { id: true, targetRole: true },
    });
    if (!owned) throw new NotFoundError("Goal not found.");

    const updated = await db.careerGoal.update({
      where: { id },
      data: { status },
    });

    if (status === "achieved") {
      createNotification(user.id, {
        type: "coach_nudge",
        title: "Goal achieved 🎯",
        body: `Congratulations on reaching your ${owned.targetRole} goal. Set your next one at /learning.`,
        href: "/learning",
        data: { targetRole: owned.targetRole },
      }).catch((e) => console.error("[NovaNest] goal_achieved notify:", e?.message));
    }

    revalidatePath("/learning");
    revalidatePath("/dashboard");
    return updated;
  },
  "Couldn't update that goal. Please try again."
);