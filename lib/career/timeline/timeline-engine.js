import { db } from "@/lib/prisma";
import { deriveAllForUser } from "@/lib/career/timeline/timeline-derivers";

export async function recordTimelineEvent(
  { userId, type, title, description, occurredAt, metadata, sourceType, sourceId },
  tx
) {
  const client = tx ?? db;
  const when = occurredAt ? new Date(occurredAt) : new Date();

  if (sourceType && sourceId) {
    const existing = await client.timelineEvent.findFirst({
      where: { userId, sourceType, sourceId, type },
      select: { id: true },
    });
    if (existing) return null;
  }

  return client.timelineEvent.create({
    data: {
      userId,
      type,
      title,
      description: description ?? null,
      occurredAt: Number.isNaN(when.getTime()) ? new Date() : when,
      metadata: metadata ?? undefined,
      sourceType: sourceType ?? "manual",
      sourceId: sourceId ?? null,
    },
  });
}

export async function listTimeline(
  { userId, since, until, types, limit = 100 },
  tx
) {
  const client = tx ?? db;
  const where = { userId };
  if (types && types.length) where.type = { in: types };
  if (since || until) {
    where.occurredAt = {};
    if (since) where.occurredAt.gte = new Date(since);
    if (until) where.occurredAt.lte = new Date(until);
  }
  return client.timelineEvent.findMany({
    where,
    orderBy: { occurredAt: "desc" },
    take: limit,
  });
}

export async function backfillTimeline(userId, tx) {
  const client = tx ?? db;
  const specs = await deriveAllForUser(userId, client);

  let created = 0;
  let skipped = 0;
  for (const spec of specs) {
    if (!spec) continue;
    const row = await recordTimelineEvent(
      {
        userId,
        type: spec.type,
        title: spec.title,
        description: spec.description,
        occurredAt: spec.occurredAt,
        metadata: spec.metadata,
        sourceType: spec.sourceType,
        sourceId: spec.sourceId,
      },
      client
    );
    if (row) created++;
    else skipped++;
  }
  return { created, skipped };
}