/**
 * Timeline Engine — records + lists + backfills the auto-generated career
 * timeline. Every milestone-writing server action calls `record` inside its
 * `db.$transaction` (tx-join, mirrors `lib/notifications.js` / `lib/gamify.js`)
 * so the timeline event commits atomically with the primary write.
 *
 * Idempotent on (userId, sourceType, sourceId) when a sourceId is provided —
 * re-deriving the same row never duplicates an event.
 *
 * Server-only.
 */
import { db } from "@/lib/prisma";
import { deriveAllForUser } from "@/lib/career/timeline/timeline-derivers";

/**
 * Record one timeline event. Idempotent on (userId, sourceType, sourceId).
 *
 * @param {object} input
 * @param {string} input.userId
 * @param {string} input.type - one of TIMELINE_TYPES
 * @param {string} input.title
 * @param {string} [input.description]
 * @param {Date|string} [input.occurredAt] - defaults to now
 * @param {object} [input.metadata]
 * @param {string} [input.sourceType]
 * @param {string} [input.sourceId]
 * @param {any} [tx]
 * @returns {Promise<object|null>} the created event, or null if deduped
 */
export async function recordTimelineEvent(
  { userId, type, title, description, occurredAt, metadata, sourceType, sourceId },
  tx
) {
  const client = tx ?? db;
  const when = occurredAt ? new Date(occurredAt) : new Date();

  // Idempotency: skip if we already have an event of this type for this source
  // row. Keying on `type` lets a single application accumulate distinct
  // milestones as it progresses (APPLIED → INTERVIEW → OFFER each get their
  // own event), while resume/quiz (fixed type) stay single-event.
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

/**
 * List a user's timeline, newest-first, with optional range + type filter.
 *
 * @param {object} input
 * @param {string} input.userId
 * @param {Date|string} [input.since]
 * @param {Date|string} [input.until]
 * @param {string[]} [input.types]
 * @param {number} [input.limit=100]
 * @param {any} [tx]
 */
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

/**
 * Backfill a user's timeline from their existing data (resume, applications,
 * mocks, assessments, cover letters). Idempotent — `recordTimelineEvent`
 * dedupes on sourceType+sourceId, so this is safe to run repeatedly.
 *
 * Used by the one-off `scripts/backfill-career-os.js` (M3) and by the
 * Inngest `timeline-backfill` job. Runs outside a caller tx by default.
 *
 * @param {string} userId
 * @param {any} [tx]
 * @returns {Promise<{ created: number, skipped: number }>}
 */
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