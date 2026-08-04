import { db } from "@/lib/prisma";
import { tokenize, scoreMemory } from "@/lib/career/memory/relevance";

const CANDIDATE_POOL = 200;

export async function createMemory(
  { userId, type, content, structured, tags, importance, source, sourceId, embedding },
  tx
) {
  const client = tx ?? db;

  if (sourceId && source) {
    const existing = await client.memoryEntry.findFirst({
      where: { userId, source, sourceId, content },
      select: { id: true },
    });
    if (existing) return existing;
  }

  return client.memoryEntry.create({
    data: {
      userId,
      type,
      content,
      structured: structured ?? undefined,
      tags: tags ?? [],
      importance: typeof importance === "number" ? importance : 0.5,
      source: source ?? "manual",
      sourceId: sourceId ?? null,
      embedding: embedding ?? undefined,
    },
  });
}

export async function extractAndWrite({ userId, source, sourceId, memories }, tx) {
  if (!Array.isArray(memories) || !memories.length) return [];
  const created = [];
  for (const m of memories) {
    if (!m || !m.type || !m.content) continue;
    try {
      const row = await createMemory(
        {
          userId,
          type: m.type,
          content: String(m.content),
          structured: m.structured,
          tags: m.tags,
          importance: m.importance,
          source,
          sourceId,
        },
        tx
      );
      created.push(row);
    } catch (err) {
      console.error("[MemoryService.extractAndWrite] skipped memory:", err?.message);
    }
  }
  return created;
}

export async function recallMemory(
  { userId, query, types, limit = 12, typeWeights, queryEmbedding },
  tx
) {
  const client = tx ?? db;
  const queryTokens = tokenize(query);

  const candidates = await client.memoryEntry.findMany({
    where: {
      userId,
      isForgotten: false,
      ...(types && types.length ? { type: { in: types } } : {}),
    },
    orderBy: [{ importance: "desc" }, { updatedAt: "desc" }],
    take: CANDIDATE_POOL,
  });

  if (!candidates.length) return [];

  const scored = candidates.map((m) => ({
    ...m,
    score: scoreMemory({ memory: m, queryTokens, typeWeights, queryEmbedding }),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

export async function forgetMemory(id, userId, tx) {
  const client = tx ?? db;
  return client.memoryEntry.updateMany({
    where: { id, userId },
    data: { isForgotten: true },
  });
}

export async function unforgetMemory(id, userId, tx) {
  const client = tx ?? db;
  return client.memoryEntry.updateMany({
    where: { id, userId },
    data: { isForgotten: false },
  });
}

export async function deleteMemory(id, userId, tx) {
  const client = tx ?? db;
  return client.memoryEntry.deleteMany({ where: { id, userId } });
}

export async function listMemory(
  { userId, type, tag, q, limit = 100, includeForgotten = false },
  tx
) {
  const client = tx ?? db;
  return client.memoryEntry.findMany({
    where: {
      userId,
      ...(includeForgotten ? {} : { isForgotten: false }),
      ...(type ? { type } : {}),
      ...(tag ? { tags: { has: tag } } : {}),
      ...(q
        ? { content: { contains: q, mode: "insensitive" } }
        : {}),
    },
    orderBy: [{ updatedAt: "desc" }],
    take: limit,
  });
}

export async function memoryStats(userId, tx) {
  const client = tx ?? db;
  const rows = await client.memoryEntry.groupBy({
    by: ["type"],
    where: { userId, isForgotten: false },
    _count: { _all: true },
  });
  const map = {};
  let total = 0;
  for (const r of rows) {
    map[r.type] = r._count._all;
    total += r._count._all;
  }
  return { byType: map, total };
}