/**
 * Memory Engine — the single retrieval entry point the AI flow calls.
 *
 * `retrieveRelevantMemories({ userId, query })`:
 *   1. classifies the query into an intent (retrieval-router),
 *   2. pulls in parallel from three sources:
 *        - StructuredMemory rows (structured-retrieval),
 *        - dedicated career models (structured-retrieval, intent-routed),
 *        - freeform MemoryEntry rows (recallMemory — reused unchanged),
 *   3. merges + dedupes + ranks everything on one scale (relevance.scoreMemory),
 *   4. renders a grouped prompt context block (memory-context),
 *   5. returns { block, manifest }.
 *
 * `block` is "" when nothing is retrieved (or any error is caught) so the chat
 * route's guarded prepend no-ops and existing prompts stay byte-identical.
 *
 * No edits to memory-service.js / relevance.js / memory-extractors.js — this
 * module only *calls* them. Server-only.
 */
import { db } from "@/lib/prisma";
import { tokenize } from "@/lib/career/memory/relevance";
import { recallMemory } from "@/lib/career/memory/memory-service";
import {
  classifyIntent,
  INTENT_SECTION_ORDER,
  KIND_TO_SECTION,
} from "@/lib/career/memory/retrieval-router";
import {
  searchStructuredMemories,
  fetchDedicatedSources,
  scoreItem,
} from "@/lib/career/memory/structured-retrieval";
import {
  groupItemsBySection,
  renderMemoryContextBlock,
  buildManifest,
} from "@/lib/career/memory/memory-context";

/**
 * Retrieve the memories relevant to a user's message.
 *
 * @param {object} input
 * @param {string} input.userId - DB User id (not clerk id)
 * @param {string} input.query - the user's message
 * @param {number} [input.limit=20] - max items to render
 * @returns {Promise<{ block: string, manifest: object }>}
 *   `block` is "" when nothing relevant is found; `manifest` is always present.
 */
export async function retrieveRelevantMemories({ userId, query, limit = 20 }) {
  if (!userId || !query?.trim()) return { block: "", manifest: emptyManifest() };

  const { intent, typeWeights, categories, memoryTypes, entities } = classifyIntent(query);
  const queryTokens = tokenize(query);

  // Three sources in parallel. Each is independently failure-tolerant: a miss
  // in one source must not abort the others.
  const [structured, dedicated, freeform] = await Promise.all([
    searchStructuredMemories({ userId, queryTokens, categories, limit }).catch(() => []),
    fetchDedicatedSources({ userId, intent, entities }).catch(() => []),
    memoryTypes?.length
      ? recallMemory({ userId, query, types: memoryTypes, typeWeights, limit: 8 }).catch(() => [])
      : Promise.resolve([]),
  ]);

  // Score everything on one scale (dedicated + structured both reuse scoreItem;
  // freeform MemoryEntry rows already carry a `score` from recallMemory).
  const dedicatedScored = dedicated.map((it) => ({ ...it, score: scoreItem(it, queryTokens, typeWeights) }));
  const structuredScored = structured; // already scored in searchStructuredMemories
  const freeformItems = (freeform || []).map((m) => ({
    kind: "memoryEntry",
    id: m.id,
    title: truncate(m.content, 80),
    summary: m.content,
    detail: "",
    tags: m.tags || [],
    importance: m.importance ?? 0.5,
    type: m.type,
    content: m.content,
    updatedAt: m.updatedAt,
    section: KIND_TO_SECTION.memoryEntry || "relevant_memories",
    score: m.score ?? scoreItem(
      { content: m.content, tags: m.tags, type: m.type, importance: m.importance, updatedAt: m.updatedAt },
      queryTokens,
      typeWeights
    ),
  }));

  // Merge + dedupe by (kind, id).
  const all = dedupe([...structuredScored, ...dedicatedScored, ...freeformItems]);
  all.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const top = all.slice(0, limit);

  const sections = groupItemsBySection(top, INTENT_SECTION_ORDER[intent] || INTENT_SECTION_ORDER.general);
  const block = renderMemoryContextBlock(sections);
  const manifest = buildManifest(intent, sections);
  return { block, manifest };
}

function emptyManifest() {
  return { intent: "general", sources: [], citations: [], totalItems: 0 };
}

function truncate(s, n) {
  const str = String(s ?? "").trim();
  return str.length > n ? str.slice(0, n - 1).trimEnd() + "…" : str;
}

function dedupe(items) {
  const seen = new Set();
  const out = [];
  for (const it of items) {
    const key = `${it.kind}:${it.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(it);
  }
  return out;
}

/**
 * Convenience for the /memory retrieval-preview panel — same retrieval, no AI
 * call. Returns the manifest + the rendered block so the UI can show exactly
 * what the AI would receive.
 */
export async function previewRetrieval({ userId, query }) {
  const { block, manifest } = await retrieveRelevantMemories({ userId, query });
  return { block, manifest };
}