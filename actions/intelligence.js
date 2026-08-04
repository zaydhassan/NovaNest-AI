"use server";

import { db } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { withErrorHandling } from "@/lib/errors";
import { memoryStats } from "@/lib/career/memory/memory-service";
import { getInterviewTrendsData } from "@/lib/career/analytics/analytics-service";
import { computeIntelligence } from "@/lib/career/intelligence/intelligence-engine";

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

export const getIntelligence = withErrorHandling(async function getIntelligence() {
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

  const since56d = new Date(Date.now() - 56 * DAY_MS);
  const since7d = new Date(Date.now() - 7 * DAY_MS);

  const [
    resume,
    assessments,
    coverLetters,
    applications,
    mocks,
    insights,
    learningTopics,
    learningSessions,
    memStats,
    timelineEvents,
    trends,
  ] = await Promise.all([
    db.resume.findUnique({
      where: { userId: user.id },
      select: { id: true, content: true, atsScore: true, feedback: true },
    }),
    db.assessment.findMany({
      where: { userId: user.id },
      select: { quizScore: true, createdAt: true, category: true },
      orderBy: { createdAt: "asc" },
    }),
    db.coverLetter.findMany({
      where: { userId: user.id },
      select: { id: true, createdAt: true },
    }),
    db.application.findMany({
      where: { userId: user.id },
      select: { status: true, rejectionReason: true, updatedAt: true, createdAt: true },
    }),
    db.mockInterview.findMany({
      where: { userId: user.id },
      select: {
        score: true,
        communicationScore: true,
        technicalDepthScore: true,
        structureScore: true,
        createdAt: true,
        improvements: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    db.industryInsight.findUnique({
      where: { industry: user.industry },
      select: { recommendedSkills: true },
    }),
    db.learningTopic.findMany({
      where: { userId: user.id },
      select: { status: true, proficiency: true },
    }),
    db.learningSession.findMany({
      where: { userId: user.id },
      select: { createdAt: true, kind: true },
      orderBy: { createdAt: "asc" },
    }),
    memoryStats(user.id),
    db.timelineEvent.findMany({
      where: { userId: user.id, occurredAt: { gte: since56d } },
      select: { occurredAt: true, type: true },
      orderBy: { occurredAt: "desc" },
    }),
    getInterviewTrendsData(user.id, { limit: 12 }),
  ]);

  const memTotal = memStats?.total ?? 0;

  const eventCounts = {
    resumes: resume ? 1 : 0,
    coverLetters: coverLetters.length,
    quizzes: assessments.length,
    mocks: mocks.length,
    applications: applications.length,
    learningSessions: learningSessions.length,
    goals: 0,
    memories: memTotal,
  };

  const recentActivity =
    learningSessions.filter((s) => new Date(s.createdAt) >= since7d).length +
    assessments.filter((a) => new Date(a.createdAt) >= since7d).length +
    mocks.filter((m) => new Date(m.createdAt) >= since7d).length +
    applications.filter((a) => new Date(a.createdAt) >= since7d).length;

  return computeIntelligence({
    resume,
    assessments,
    coverLetters,
    applications,
    mocks,
    userSkills: user.skills,
    insights,
    learningTopics,
    learningSessions,
    memoryStats: memStats,
    user: { streak: user.streak, lastActiveAt: user.lastActiveAt, xp: user.xp },
    timelineEvents,
    trends,
    eventCounts,
    recentActivity,
    computedAt: new Date().toISOString(),
  });
}, "Couldn't load your Career Intelligence. Please try again.");