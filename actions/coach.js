"use server";

import { db } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { NotFoundError, ValidationError, withErrorHandling } from "@/lib/errors";
import { generateJSON } from "@/lib/ai/gemini";
import { buildPrompt } from "@/lib/career/prompts/prompt-service";
import { buildUserProfile, summarizeMemory } from "@/lib/career/ui/chat-context";
import { recallMemory } from "@/lib/career/memory/memory-service";
import { createNotification } from "@/lib/notifications";

/**
 * List coach insights, newest-first. Pass { unreadOnly: true } for the bell.
 */
export const getInsights = withErrorHandling(async function getInsights({
  unreadOnly,
  limit,
} = {}) {
  const user = await requireUser({ select: { id: true } });
  return db.coachInsight.findMany({
    where: {
      userId: user.id,
      ...(unreadOnly ? { isRead: false } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: Math.min(50, Math.max(1, Number(limit) || 20)),
    select: {
      id: true,
      kind: true,
      title: true,
      body: true,
      severity: true,
      href: true,
      data: true,
      isRead: true,
      isActioned: true,
      createdAt: true,
    },
  });
}, "Couldn't load your coach insights. Please try again.");

/** Count unread insights (for the drawer/bell badge). */
export const getUnreadInsightCount = withErrorHandling(
  async function getUnreadInsightCount() {
    const user = await requireUser({ select: { id: true } });
    return db.coachInsight.count({ where: { userId: user.id, isRead: false } });
  },
  "Couldn't load your insight count."
);

/** Mark an insight read. */
export const markInsightRead = withErrorHandling(async function markInsightRead(id) {
  const user = await requireUser({ select: { id: true } });
  if (!id) throw new ValidationError("An insight id is required.");
  const res = await db.coachInsight.updateMany({
    where: { id, userId: user.id },
    data: { isRead: true },
  });
  if (!res.count) throw new NotFoundError("That insight wasn't found.");
  return { success: true };
}, "Couldn't update that insight. Please try again.");

/** Mark an insight as actioned (user clicked through). */
export const markInsightActioned = withErrorHandling(async function markInsightActioned(id) {
  const user = await requireUser({ select: { id: true } });
  if (!id) throw new ValidationError("An insight id is required.");
  const res = await db.coachInsight.updateMany({
    where: { id, userId: user.id },
    data: { isRead: true, isActioned: true },
  });
  if (!res.count) throw new NotFoundError("That insight wasn't found.");
  return { success: true };
}, "Couldn't update that insight. Please try again.");

/**
 * Generate 1-3 proactive coach insights on demand (the "Nudge me" button).
 * Rate-limited hard (5/10min) since it runs a Gemini call over the user's data.
 * M10 turns this into a weekly cron; M5 ships the on-demand version.
 */
export const nudgeNow = withErrorHandling(async function nudgeNow() {
  const user = await requireUser({
    select: {
      id: true,
      clerkUserId: true,
      industry: true,
      experience: true,
      skills: true,
      bio: true,
      streak: true,
    },
  });
  rateLimit({ key: `nudge:${user.clerkUserId}`, limit: 5, windowMs: 10 * 60_000 });

  // Recent activity summary for the prompt.
  const [mockCount, appCount, resume, lastMock] = await Promise.all([
    db.mockInterview.count({ where: { userId: user.id } }),
    db.application.count({ where: { userId: user.id } }),
    db.resume.findUnique({ where: { userId: user.id }, select: { id: true } }),
    db.mockInterview.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: { score: true, createdAt: true },
    }),
  ]);
  const recentActivity = [
    `${mockCount} mock interview(s)`,
    `${appCount} application(s) tracked`,
    resume ? "has a saved resume" : "no resume saved yet",
    lastMock ? `last mock scored ${lastMock.score ?? "-"}/100` : "no mocks yet",
    `${user.streak || 0}-day streak`,
  ].join("; ");

  const memory = await recallMemory({
    userId: user.id,
    query: "career goals weaknesses recent progress",
    limit: 8,
  }).catch(() => []);

  let insights = [];
  try {
    const parsed = await generateJSON(
      buildPrompt("coachNudge", {
        profile: buildUserProfile(user),
        recentActivity,
        memorySummary: summarizeMemory(memory),
      })
    );
    insights = Array.isArray(parsed?.insights) ? parsed.insights : [];
  } catch (e) {
    console.error("[NovaNest] nudgeNow generation failed:", e?.message);
    throw new Error("The coach couldn't generate nudges right now. Please try again.");
  }

  const created = [];
  for (const ins of insights.slice(0, 3)) {
    if (!ins?.title) continue;
    const row = await db.coachInsight.create({
      data: {
        userId: user.id,
        kind: String(ins.kind ?? "nudge"),
        title: String(ins.title).slice(0, 200),
        body: ins.body ? String(ins.body).slice(0, 600) : null,
        severity: String(ins.severity ?? "info"),
        href: ins.href ? String(ins.href) : null,
        data: { source: "nudge_now" },
      },
    });
    created.push(row);
    createNotification(user.id, {
      type: "coach_insight",
      title: row.title,
      body: row.body ?? undefined,
      href: row.href ?? "/coach",
      data: { insightId: row.id, kind: row.kind },
    }).catch((e) => console.error("[NovaNest] nudge notify:", e?.message));
  }

  return created;
}, "Couldn't generate coach nudges. Please try again.");

/**
 * Suggested opening prompts for an empty /coach session. Static + personalized
 * from the user's industry so there's no AI cost on first paint.
 */
export const getSuggestedPrompts = withErrorHandling(async function getSuggestedPrompts() {
  const user = await requireUser({
    select: { id: true, industry: true, skills: true },
  });
  const industry = user.industry?.split("-").pop()?.replace(/-/g, " ") ?? "your field";
  const topSkill = (user.skills?.[0] ?? "your strongest skill").toLowerCase();

  return [
    `I have an interview tomorrow — help me prep`,
    `What should I learn next in ${industry}?`,
    `Review my resume for a ${industry} role`,
    `How do I close my biggest skill gap in ${topSkill}?`,
    `Help me plan my next 30 days toward a senior role`,
  ];
}, "Couldn't load suggested prompts. Please try again.");