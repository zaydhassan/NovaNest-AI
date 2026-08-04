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

    recordTimelineEvent({
      userId: user.id,
      type: "learning",
      title: `Started learning ${row.skill}`,
      description: "New skill added to your learning board.",
      sourceType: "learning",
      sourceId: `${row.id}#started`,
    }).catch((e) => console.error("[NovaNest] timeline topic-start:", e?.message));
  }

  revalidatePath("/learning");
  revalidatePath("/dashboard");
  return row;
}, "Couldn't save that topic. Please try again.");

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
      recordTimelineEvent({
        userId: user.id,
        type: "achievement",
        title: `Mastered ${owned.skill}`,
        description: "Skill marked as learned — Career Health learning pillar rose.",
        sourceType: "learning",
        sourceId: `${owned.id}#learned`,
      }).catch((e) => console.error("[NovaNest] timeline topic-learned:", e?.message));

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

      if (topic) {
        const nextProf = topic.status === "learned" ? 1 : Math.min(1, (topic.proficiency || 0) + 0.1);
        await tx.learningTopic.update({
          where: { id: topic.id },
          data: { lastTouchedAt: new Date(), proficiency: nextProf },
        });
      }

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

export const recommendedTopics = withErrorHandling(
  async function recommendedTopics() {
    const user = await requireUser({ select: { id: true } });
    return getRecommendedTopics(user.id);
  },
  "Couldn't load your recommendations. Please try again."
);