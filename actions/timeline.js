"use server";

import { requireUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { timelineFilterSchema } from "@/lib/schemas";
import { ValidationError, withErrorHandling } from "@/lib/errors";
import {
  listTimeline,
  backfillTimeline,
} from "@/lib/career/timeline/timeline-engine";

/**
 * List the signed-in user's auto-generated career timeline, newest-first, with
 * optional range + type filters. Backfill runs implicitly is NOT done here —
 * the timeline is populated lazily by the milestone actions + the backfill
 * job/script. This is a pure read.
 */
export const getTimeline = withErrorHandling(async function getTimeline(params = {}) {
  const user = await requireUser();

  const parsed = timelineFilterSchema.safeParse(params);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues?.[0]?.message ?? "Invalid timeline filter.");
  }

  return listTimeline({
    userId: user.id,
    since: parsed.data.since,
    until: parsed.data.until,
    types: parsed.data.types,
    limit: parsed.data.limit,
  });
}, "Couldn't load your timeline. Please try again.");

/**
 * Backfill the signed-in user's timeline from their existing data. Idempotent
 * (dedupes per-source per-type). Useful the first time a user opens /timeline
 * after the Career OS rollout, and safe to call repeatedly. Rate-limited so a
 * client loop can't hammer it.
 */
export const backfillTimelineAction = withErrorHandling(async function backfillTimelineAction() {
  const user = await requireUser();
  rateLimit({ key: `timeline-backfill:${user.clerkUserId}`, limit: 5, windowMs: 10 * 60_000 });

  return backfillTimeline(user.id);
}, "Couldn't backfill your timeline. Please try again.");