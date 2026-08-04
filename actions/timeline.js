"use server";

import { requireUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { timelineFilterSchema } from "@/lib/schemas";
import { ValidationError, withErrorHandling } from "@/lib/errors";
import {
  listTimeline,
  backfillTimeline,
} from "@/lib/career/timeline/timeline-engine";

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

export const backfillTimelineAction = withErrorHandling(async function backfillTimelineAction() {
  const user = await requireUser();
  rateLimit({ key: `timeline-backfill:${user.clerkUserId}`, limit: 5, windowMs: 10 * 60_000 });

  return backfillTimeline(user.id);
}, "Couldn't backfill your timeline. Please try again.");