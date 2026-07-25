/**
 * Memory Service — the core of NovaNest's long-term career memory.
 *
 * Every agent and every auto-extraction path writes/recalls through this
 * module. It defines the retrieval contract: `recall` returns ranked memories
 * with a `score` field the UI surfaces ("why was this recalled?").
 *
 * Pure-ish: takes a Prisma transaction client (`tx`) OR the shared `db`, so it
 * can join a caller's `db.$transaction` (memory/timeline/notification commit
 * atomically with the primary write — mirrors `lib/notifications.js` and
 * `lib/gamify.js`). Server-only.
 */
import { db } from "@/lib/prisma";
import { tokenize, scoreMemory } from "@/lib/career/memory/relevance";

// Candidate pre-filter size before in-JS scoring. Cheap SQL sort on
// importance + recency, then score the top slice. Tunable.
const CANDIDATE_POOL = 200;

/**
 * Create one memory, idempotent on (userId, source, sourceId, content) when
 * a source row is provided. Returns the existing row if the dedupe key hits.
 *
 * @param {object} input
 * @param {string} input.userId
 * @param {string} input.type - one of MEMORY_TYPES
 * @param {string} input.content
 * @param {object} [input.structured]
 * @param {string[]} [input.tags]
 * @param {number} [input.importance] - 0..1
 * @param {string} [input.source] - one of MEMORY_SOURCES
 * @param {string} [input.sourceId]
 * @param {number[]} [input.embedding]
 * @param {any} [tx]
 * @returns {Promise<object>} the created (or existing) MemoryEntry
 */
export async function createMemory(
  { userId, type, content, structured, tags, importance, source, sourceId, embedding },
  tx
) {
  const client = tx ?? db;

  // Idempotency: if this memory came from a tracked source row, skip if we
  // already have one with identical content for that source.
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

/**
 * Bulk-write extracted memories for a source (the hook the per-source
 * extractors in M2 call). Each entry is created idempotently. Skips entries
 * that fail validation (bad type) so one bad extract never breaks the tx.
 *
 * @param {object} input
 * @param {string} input.userId
 * @param {string} input.source
 * @param {string} [input.sourceId]
 * @param {Array<{type:string,content:string,structured?:object,tags?:string[],importance?:number}>} input.memories
 * @param {any} [tx]
 * @returns {Promise<object[]>} the created MemoryEntry rows
 */
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
      // Best-effort: a single bad memory must not abort the whole extraction.
      console.error("[MemoryService.extractAndWrite] skipped memory:", err?.message);
    }
  }
  return created;
}

/**
 * Recall the most relevant non-forgotten memories for a query.
 *
 * Two-phase: (1) cheap SQL pre-filter to top `CANDIDATE_POOL` by importance +
 * recency, filtered by type(s); (2) in-JS relevance scoring via `scoreMemory`,
 * returning `limit` rows each annotated with a `score`.
 *
 * @param {object} input
 * @param {string} input.userId
 * @param {string} input.query
 * @param {string[]} [input.types] - restrict to these MEMORY_TYPES
 * @param {number} [input.limit=12]
 * @param {Record<string, number>} [input.typeWeights] - intent-driven weights
 * @param {number[]} [input.queryEmbedding] - optional query vector
 * @param {any} [tx]
 * @returns {Promise<Array<object & { score: number }>>}
 */
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

/**
 * Soft-forget a memory (excluded from recall, retained for audit/unforget).
 * Ownership-checked: only the user's own memories.
 * @param {string} id
 * @param {string} userId
 * @param {any} [tx]
 */
export async function forgetMemory(id, userId, tx) {
  const client = tx ?? db;
  return client.memoryEntry.updateMany({
    where: { id, userId },
    data: { isForgotten: true },
  });
}

/**
 * Restore a soft-forgotten memory.
 * @param {string} id
 * @param {string} userId
 * @param {any} [tx]
 */
export async function unforgetMemory(id, userId, tx) {
  const client = tx ?? db;
  return client.memoryEntry.updateMany({
    where: { id, userId },
    data: { isForgotten: false },
  });
}

/**
 * Hard delete a memory (GDPR/CCPA). Cascades from User.onDelete: Cascade.
 * @param {string} id
 * @param {string} userId
 * @param {any} [tx]
 */
export async function deleteMemory(id, userId, tx) {
  const client = tx ?? db;
  return client.memoryEntry.deleteMany({ where: { id, userId } });
}

/**
 * List memories for the management surface, with optional filters.
 * Excludes forgotten by default unless `includeForgotten`.
 *
 * @param {object} input
 * @param {string} input.userId
 * @param {string} [input.type]
 * @param {string} [input.tag]
 * @param {string} [input.q] - substring search on content
 * @param {number} [input.limit=100]
 * @param {boolean} [input.includeForgotten=false]
 * @param {any} [tx]
 */
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

/**
 * Count memories by type — used by the Career Engine memory pillar + Twin.
 * @param {string} userId
 * @param {any} [tx]
 */
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