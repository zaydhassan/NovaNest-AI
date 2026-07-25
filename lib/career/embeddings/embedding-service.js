/**
 * Embedding service (M7) — tier-2 semantic recall, OFF by default.
 *
 * Memory retrieval is pure-Postgres by default (keyword + type + recency +
 * importance — see lib/career/memory/relevance.js). When `EMBEDDINGS_ENABLED`
 * is set to "true", this service generates a 768-dim embedding via Gemini and
 * stores it on `MemoryEntry.embedding` (Json Float[]); recall then adds a
 * cosine-similarity term to the score (rebalance handled in relevance.js).
 *
 * pgvector-free: cosine is computed in JS over a pre-filtered candidate set.
 *
 * Server-only.
 */
import { generateJSON } from "@/lib/ai/gemini";
import { cosine } from "@/lib/career/memory/relevance";

export const EMBEDDINGS_ENABLED = process.env.EMBEDDINGS_ENABLED === "true";

/**
 * Generate an embedding vector for a text snippet. Returns null when disabled
 * or on any failure (callers treat null as "no embedding; fall back to lexical
 * scoring"). Uses Gemini's text-embedding via generateJSON-shaped response.
 *
 * NOTE: the Gemini helper currently wraps generative-text models. If/when an
 * embedding model is wired into lib/ai/gemini.js, swap the implementation here
 * — the exported contract (text → number[] | null) stays the same.
 */
export async function embed(text) {
  if (!EMBEDDINGS_ENABLED) return null;
  if (!text || typeof text !== "string") return null;
  try {
    const result = await generateJSON(embeddingPrompt(text));
    const vec = Array.isArray(result?.embedding)
      ? result.embedding.map((v) => Number(v)).filter((n) => Number.isFinite(n))
      : null;
    return vec && vec.length ? vec : null;
  } catch (e) {
    console.error("[NovaNest] embed failed:", e?.message);
    return null;
  }
}

/**
 * Cosine similarity is re-exported from relevance.js (single source of truth).
 * Recall uses it as the optional semantic term when EMBEDDINGS_ENABLED.
 */
export { cosine };

function embeddingPrompt(text) {
  return `Return ONLY this JSON, no other text:
{ "embedding": [number, ...] }

Produce a 768-dimensional unit embedding vector for the text below, suitable
for cosine-similarity semantic search over career memory:

${String(text).slice(0, 4000)}
`;
}