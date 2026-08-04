"use server";

import { requireUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { memorySchema } from "@/lib/schemas";
import { ValidationError, NotFoundError } from "@/lib/errors";
import { withErrorHandling } from "@/lib/errors";
import {
  createMemory,
  listMemory,
  forgetMemory,
  unforgetMemory,
  deleteMemory,
} from "@/lib/career/memory/memory-service";

export const addMemory = withErrorHandling(async function addMemory(data) {
  const user = await requireUser();
  rateLimit({ key: `memory:${user.clerkUserId}`, limit: 60, windowMs: 60_000 });

  const parsed = memorySchema.safeParse(data);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues?.[0]?.message ?? "Invalid memory.");
  }

  return createMemory(
    {
      userId: user.id,
      type: parsed.data.type,
      content: parsed.data.content,
      tags: parsed.data.tags,
      importance: parsed.data.importance,
      source: "manual",
    }
  );
}, "Couldn't save that memory. Please try again.");

export const listMemories = withErrorHandling(async function listMemories({
  type,
  tag,
  q,
  limit,
  includeForgotten,
} = {}) {
  const user = await requireUser();
  return listMemory(
    {
      userId: user.id,
      type: type || undefined,
      tag: tag || undefined,
      q: q || undefined,
      limit: Number(limit) || 100,
      includeForgotten: !!includeForgotten,
    }
  );
}, "Couldn't load your memories. Please try again.");

export const forgetMemoryAction = withErrorHandling(async function forgetMemoryAction(id) {
  const user = await requireUser();
  if (!id) throw new ValidationError("Memory id is required.");
  const res = await forgetMemory(id, user.id);
  if (!res.count) throw new NotFoundError("Memory not found.");
  return { success: true };
}, "Couldn't forget that memory. Please try again.");

export const unforgetMemoryAction = withErrorHandling(async function unforgetMemoryAction(id) {
  const user = await requireUser();
  if (!id) throw new ValidationError("Memory id is required.");
  const res = await unforgetMemory(id, user.id);
  if (!res.count) throw new NotFoundError("Memory not found.");
  return { success: true };
}, "Couldn't restore that memory. Please try again.");

export const deleteMemoryAction = withErrorHandling(async function deleteMemoryAction(id) {
  const user = await requireUser();
  if (!id) throw new ValidationError("Memory id is required.");
  const res = await deleteMemory(id, user.id);
  if (!res.count) throw new NotFoundError("Memory not found.");
  return { success: true };
}, "Couldn't delete that memory. Please try again.");