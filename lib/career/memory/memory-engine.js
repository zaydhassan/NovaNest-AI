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

export async function retrieveRelevantMemories({ userId, query, limit = 20 }) {
  if (!userId || !query?.trim()) return { block: "", manifest: emptyManifest() };

  const { intent, typeWeights, categories, memoryTypes, entities } = classifyIntent(query);
  const queryTokens = tokenize(query);

  const [structured, dedicated, freeform] = await Promise.all([
    searchStructuredMemories({ userId, queryTokens, categories, limit }).catch(() => []),
    fetchDedicatedSources({ userId, intent, entities }).catch(() => []),
    memoryTypes?.length
      ? recallMemory({ userId, query, types: memoryTypes, typeWeights, limit: 8 }).catch(() => [])
      : Promise.resolve([]),
  ]);

  const dedicatedScored = dedicated.map((it) => ({ ...it, score: scoreItem(it, queryTokens, typeWeights) }));
  const structuredScored = structured;
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

export async function previewRetrieval({ userId, query }) {
  const { block, manifest } = await retrieveRelevantMemories({ userId, query });
  return { block, manifest };
}