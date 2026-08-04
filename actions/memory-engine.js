"use server";

import { requireUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { db } from "@/lib/prisma";
import { ValidationError, NotFoundError, withErrorHandling } from "@/lib/errors";
import {
  structuredMemorySchema,
  structuredMemoryUpdateSchema,
  STRUCTURED_MEMORY_PAYLOAD_SCHEMAS,
} from "@/lib/schemas";
import { previewRetrieval } from "@/lib/career/memory/memory-engine";
import { recordTimelineEvent } from "@/lib/career/timeline/timeline-engine";

const DEFAULT_LIST_LIMIT = 200;

function recordTimelineEventForMemory(userId, mem) {
  if (!mem) return null;
  if (mem.category === "certificate") {
    return recordTimelineEvent({
      userId,
      type: "achievement",
      title: `Certified: ${mem.title}`,
      description: mem.summary ?? null,
      metadata: { category: mem.category },
      sourceType: "memory",
      sourceId: mem.id,
    });
  }
  if (mem.category === "project") {
    return recordTimelineEvent({
      userId,
      type: "building",
      title: `Built: ${mem.title}`,
      description: mem.summary ?? null,
      metadata: { category: mem.category },
      sourceType: "memory",
      sourceId: mem.id,
    });
  }
  return null;
}

export const addStructuredMemory = withErrorHandling(async function addStructuredMemory(data) {
  const user = await requireUser();
  rateLimit({ key: `smemory:${user.clerkUserId}`, limit: 60, windowMs: 60_000 });

  const parsed = structuredMemorySchema.safeParse(data);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues?.[0]?.message ?? "Invalid structured memory.");
  }
  const { category, title, summary, detail, tags, importance, linkedType, linkedId, structured } =
    parsed.data;

  if (structured != null) {
    const payloadSchema = STRUCTURED_MEMORY_PAYLOAD_SCHEMAS[category];
    if (payloadSchema) {
      const p = payloadSchema.safeParse(structured);
      if (!p.success) {
        throw new ValidationError(p.error.issues?.[0]?.message ?? "Invalid payload for this category.");
      }
    }
  }

  const created = await db.structuredMemory.create({
    data: {
      userId: user.id,
      category,
      title,
      summary: summary || null,
      detail: detail || null,
      tags: tags ?? [],
      importance: typeof importance === "number" ? importance : 0.5,
      source: "manual",
      linkedType: linkedType || null,
      linkedId: linkedId || null,
      structured: structured ?? null,
    },
  });

  recordTimelineEventForMemory(user.id, created)?.catch((e) =>
    console.error("[NovaNest] timeline memory:", e?.message)
  );

  return created;
}, "Couldn't save that memory. Please try again.");

export const listStructuredMemories = withErrorHandling(async function listStructuredMemories({
  category,
  q,
  includeArchived,
  limit,
} = {}) {
  const user = await requireUser();
  return db.structuredMemory.findMany({
    where: {
      userId: user.id,
      ...(includeArchived ? {} : { isArchived: false }),
      ...(category ? { category } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { summary: { contains: q, mode: "insensitive" } },
              { detail: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ isArchived: "asc" }, { updatedAt: "desc" }],
    take: Number(limit) || DEFAULT_LIST_LIMIT,
  });
}, "Couldn't load your memories. Please try again.");

export const countStructuredMemories = withErrorHandling(async function countStructuredMemories() {
  const user = await requireUser();
  const rows = await db.structuredMemory.groupBy({
    by: ["category"],
    where: { userId: user.id, isArchived: false },
    _count: { _all: true },
  });
  const map = {};
  let total = 0;
  for (const r of rows) {
    map[r.category] = r._count._all;
    total += r._count._all;
  }
  return { byCategory: map, total };
}, "Couldn't load memory counts. Please try again.");

export const updateStructuredMemory = withErrorHandling(async function updateStructuredMemory(data) {
  const user = await requireUser();
  const parsed = structuredMemoryUpdateSchema.safeParse(data);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues?.[0]?.message ?? "Invalid update.");
  }
  const { id, structured, ...rest } = parsed.data;

  const owned = await db.structuredMemory.findFirst({
    where: { id, userId: user.id },
    select: { id: true, category: true },
  });
  if (!owned) throw new NotFoundError("Memory not found.");

  if (structured != null) {
    const payloadSchema = STRUCTURED_MEMORY_PAYLOAD_SCHEMAS[owned.category];
    if (payloadSchema) {
      const p = payloadSchema.safeParse(structured);
      if (!p.success) {
        throw new ValidationError(p.error.issues?.[0]?.message ?? "Invalid payload.");
      }
    }
  }

  return db.structuredMemory.update({
    where: { id },
    data: {
      ...(rest.title !== undefined ? { title: rest.title } : {}),
      ...(rest.summary !== undefined ? { summary: rest.summary || null } : {}),
      ...(rest.detail !== undefined ? { detail: rest.detail || null } : {}),
      ...(rest.tags !== undefined ? { tags: rest.tags } : {}),
      ...(rest.importance !== undefined ? { importance: rest.importance } : {}),
      ...(structured !== undefined ? { structured: structured ?? null } : {}),
    },
  });
}, "Couldn't update that memory. Please try again.");

export const archiveStructuredMemory = withErrorHandling(async function archiveStructuredMemory(id) {
  const user = await requireUser();
  if (!id) throw new ValidationError("Memory id is required.");
  const res = await db.structuredMemory.updateMany({
    where: { id, userId: user.id },
    data: { isArchived: true },
  });
  if (!res.count) throw new NotFoundError("Memory not found.");
  return { success: true };
}, "Couldn't archive that memory. Please try again.");

export const unarchiveStructuredMemory = withErrorHandling(async function unarchiveStructuredMemory(id) {
  const user = await requireUser();
  if (!id) throw new ValidationError("Memory id is required.");
  const res = await db.structuredMemory.updateMany({
    where: { id, userId: user.id },
    data: { isArchived: false },
  });
  if (!res.count) throw new NotFoundError("Memory not found.");
  return { success: true };
}, "Couldn't restore that memory. Please try again.");

export const deleteStructuredMemory = withErrorHandling(async function deleteStructuredMemory(id) {
  const user = await requireUser();
  if (!id) throw new ValidationError("Memory id is required.");
  const res = await db.structuredMemory.deleteMany({ where: { id, userId: user.id } });
  if (!res.count) throw new NotFoundError("Memory not found.");
  return { success: true };
}, "Couldn't delete that memory. Please try again.");

export const previewRetrievalAction = withErrorHandling(async function previewRetrievalAction(query) {
  const user = await requireUser();
  if (!query || !query.trim()) {
    return { block: "", manifest: { intent: "general", sources: [], citations: [], totalItems: 0 } };
  }
  rateLimit({ key: `smpreview:${user.clerkUserId}`, limit: 30, windowMs: 60_000 });
  return previewRetrieval({ userId: user.id, query });
}, "Couldn't run that retrieval preview. Please try again.");

export const snapshotResumeVersion = withErrorHandling(async function snapshotResumeVersion(label) {
  const user = await requireUser();
  rateLimit({ key: `smsnapshot:${user.clerkUserId}`, limit: 20, windowMs: 60_000 });

  const resume = await db.resume.findUnique({
    where: { userId: user.id },
    select: { id: true, content: true, atsScore: true, updatedAt: true },
  });
  if (!resume?.content) throw new NotFoundError("Save a resume first, then snapshot it here.");

  const stamp = new Date().toISOString().slice(0, 10);
  const finalLabel = (label && String(label).trim()) || `Resume · ${stamp}`;

  return db.structuredMemory.create({
    data: {
      userId: user.id,
      category: "resume_version",
      title: finalLabel,
      summary: typeof resume.atsScore === "number" ? `ATS ${resume.atsScore}/100 · snapshot ${stamp}` : `Snapshot ${stamp}`,
      detail: resume.content,
      tags: ["resume", "snapshot"],
      importance: 0.7,
      source: "resume",
      sourceId: resume.id,
      linkedType: "resume",
      linkedId: resume.id,
      structured: {
        label: finalLabel,
        snapshot: resume.content,
        atsScore: resume.atsScore ?? null,
        notes: null,
      },
    },
  });
}, "Couldn't snapshot your resume. Please try again.");