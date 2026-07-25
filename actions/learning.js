"use server";

import { db } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { NotFoundError, ValidationError, withErrorHandling } from "@/lib/errors";
import { bumpActivity } from "@/lib/gamify";
import { createNotification } from "@/lib/notifications";
import {
  upsertTopicSchema,
  logLearningSessionSchema,
} from "@/lib/schemas";
import { LEARNING_TOPIC_STATUSES } from "@/lib/constants";
import { getRecommendedTopics } from "@/lib/career/recommendations/recommendation-service";
import { recordTimelineEvent } from "@/lib/career/timeline/timeline-engine";
import {
  deriveFromLearningSession,
} from "@/lib/career/timeline/timeline-derivers";
import { fromLearning } from "@/lib/career/memory/memory-extractors";
import { revalidatePath } from "next/cache";

/**
 * List the signed-in user's learning topics (with session counts) newest-first.
 * Used by the /learning kanban. `lastTouchedAt` is bumped whenever a session is
 * logged against a topic so the board can surface "recently practiced".
 */
export const getTopics = withErrorHandling(async function getTopics() {
  const user = await requireUser({ select: { id: true } });
  return db.learningTopic.findMany({
    where: { userId: user.id },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    include: {
      _count: { select: { sessions: true } },
    },
  });
}, "Couldn't load your learning topics. Please try again.");

/**
 * Create or update a learning topic. When `id` is omitted a new topic is
 * created; the optional `status` is validated against LEARNING_TOPIC_STATUSES.
 */
export const upsertTopic = withErrorHandling(async function upsertTopic(data) {
  const user = await requireUser({ select: { id: true, clerkUserId: true } });
  rateLimit({ key: `learning-topic:${user.clerkUserId}`, limit: 30, windowMs: 60_000 });

  const parsed = upsertTopicSchema.safeParse(data);
  if (!parsed.success) {
    throw new ValidationError(
      parsed.error.issues?.[0]?.message ?? "Invalid topic."
    );
  }
  const { id, skill, status, proficiency, notes } = parsed.data;

  if (status && !LEARNING_TOPIC_STATUSES.includes(status)) {
    throw new ValidationError("Invalid topic status.");
  }

  let row;
  if (id) {
    // Ownership check BEFORE the update: only the signed-in user's row is
    // mutable. A missing/unowned id surfaces as a single NotFoundError.
    const owned = await db.learningTopic.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });
    if (!owned) throw new NotFoundError("Topic not found.");

    row = await db.learningTopic.update({
      where: { id },
      data: {
        skill,
        status: status ?? undefined,
        proficiency: typeof proficiency === "number" ? proficiency : undefined,
        notes: notes ?? undefined,
        ...(status === "learned" ? { proficiency: 1 } : {}),
        lastTouchedAt: new Date(),
      },
    });
  } else {
    row = await db.learningTopic.create({
      data: {
        userId: user.id,
        skill,
        status: status ?? "todo",
        proficiency: typeof proficiency === "number" ? proficiency : 0,
        notes: notes ?? null,
      },
    });
  }

  revalidatePath("/learning");
  revalidatePath("/dashboard");
  return row;
}, "Couldn't save that topic. Please try again.");

/**
 * Move a topic between board columns. Validates the new status + ownership.
 * Marking a topic `learned` sets proficiency to 1 and bumps the Career Health
 * learning pillar on the next dashboard read (which reads live topic data).
 */
export const markTopicStatus = withErrorHandling(
  async function markTopicStatus(id, status) {
    const user = await requireUser({ select: { id: true } });
    if (!id) throw new ValidationError("Topic id is required.");
    if (!LEARNING_TOPIC_STATUSES.includes(status)) {
      throw new ValidationError("Invalid topic status.");
    }

    const owned = await db.learningTopic.findFirst({
      where: { id, userId: user.id },
      select: { id: true, skill: true },
    });
    if (!owned) throw new NotFoundError("Topic not found.");

    const updated = await db.learningTopic.update({
      where: { id },
      data: {
        status,
        ...(status === "learned" ? { proficiency: 1 } : {}),
        lastTouchedAt: new Date(),
      },
    });

    if (status === "learned") {
      createNotification(user.id, {
        type: "learning_recommendation",
        title: `Learned: ${owned.skill}`,
        body: "Marked as learned — your Career Health learning pillar just rose.",
        href: "/learning",
        data: { skill: owned.skill, status },
      }).catch((e) => console.error("[NovaNest] learning_learned notify:", e?.message));
    }

    revalidatePath("/learning");
    revalidatePath("/dashboard");
    return updated;
  },
  "Couldn't update that topic. Please try again."
);

/**
 * Log a learning session (a practice activity). The session row is the
 * primary write; memory + timeline + activity + notification are tx-joined so
 * they commit atomically with it. When a `topicId` is provided the topic's
 * `lastTouchedAt` and (for non-learned) proficiency are nudged upward.
 *
 * `kind` maps an existing activity (quiz/mock/chat/resource/project); the
 * optional `sourceId` links back to the originating row (e.g. the Assessment
 * or MockInterview id) so the timeline is dedupable but never double-counts.
 */
export const logLearningSession = withErrorHandling(
  async function logLearningSession(data) {
    const user = await requireUser({
      select: { id: true, clerkUserId: true },
    });
    rateLimit({ key: `learning-session:${user.clerkUserId}`, limit: 30, windowMs: 60_000 });

    const parsed = logLearningSessionSchema.safeParse(data);
    if (!parsed.success) {
      throw new ValidationError(
        parsed.error.issues?.[0]?.message ?? "Invalid session."
      );
    }
    const { topicId, kind, sourceId, summary, outcome, durationMin } = parsed.data;

    // If a topic is referenced, verify ownership before attaching.
    let topic = null;
    if (topicId) {
      topic = await db.learningTopic.findFirst({
        where: { id: topicId, userId: user.id },
        select: { id: true, skill: true, status: true, proficiency: true },
      });
      if (!topic) throw new NotFoundError("Topic not found.");
    }

    const session = await db.$transaction(async (tx) => {
      const created = await tx.learningSession.create({
        data: {
          userId: user.id,
          topicId: topic?.id ?? null,
          kind,
          sourceId: sourceId ?? null,
          summary: summary ?? null,
          outcome: outcome ?? undefined,
          durationMin: durationMin ?? null,
        },
        include: { topic: { select: { skill: true } } },
      });

      // Nudge the topic's recency + proficiency (caps at 1; learned stays 1).
      if (topic) {
        const nextProf = topic.status === "learned" ? 1 : Math.min(1, (topic.proficiency || 0) + 0.1);
        await tx.learningTopic.update({
          where: { id: topic.id },
          data: { lastTouchedAt: new Date(), proficiency: nextProf },
        });
      }

      // Atomic side-effects inside the same tx (mirrors applications/mock flows).
      try {
        await recordTimelineEvent(
          { userId: user.id, ...deriveFromLearningSession(created) },
          tx
        );
      } catch (e) {
        console.error("[NovaNest] timeline learning:", e?.message);
      }
      try {
        await fromLearning(user.id, created, tx);
      } catch (e) {
        console.error("[NovaNest] fromLearning memory:", e?.message);
      }
      try {
        await bumpActivity(user.id, "learning_session", { tx });
      } catch (e) {
        console.error("[NovaNest] bumpActivity learning_session:", e?.message);
      }

      return created;
    });

    // Best-effort notification outside the tx (fire-and-forget, like applications).
    createNotification(user.id, {
      type: "learning_recommendation",
      title: `Learning session logged (${kind})`,
      body: topic?.skill
        ? `Practiced ${topic.skill} — keep the streak going.`
        : "Nice — another practice session in the books.",
      href: "/learning",
      data: { kind, skill: topic?.skill ?? null, durationMin: durationMin ?? null },
    }).catch((e) => console.error("[NovaNest] learning_session notify:", e?.message));

    revalidatePath("/learning");
    revalidatePath("/dashboard");
    revalidatePath("/timeline");
    return session;
  },
  "Couldn't log that session. Please try again."
);

/**
 * Recommended next topics for the signed-in user (drives the /learning
 * recommendation panel). Delegates to the recommendation service which
 * combines the active goal + industry insights + mock weaknesses + existing
 * topics.
 */
export const recommendedTopics = withErrorHandling(
  async function recommendedTopics() {
    const user = await requireUser({ select: { id: true } });
    return getRecommendedTopics(user.id);
  },
  "Couldn't load your recommendations. Please try again."
);