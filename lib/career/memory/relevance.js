/**
 * Pure memory-relevance scoring — no DB, no IO.
 *
 * Used by `MemoryService.recall` to rank candidate memories against a query.
 * The default weighting favours keyword overlap, then type intent, recency,
 * and stored importance. When embeddings are enabled
 * (`process.env.EMBEDDINGS_ENABLED === "true"`), a cosine-similarity term is
 * blended in and the other weights rebalance (see `scoreMemory`).
 *
 * Everything here is deterministic and side-effect free so it can be unit-tested
 * in isolation and reused by agents that want to re-rank a memory slice.
 */

// Tunable weights for the default (no-embeddings) scoring path.
// final = W_KEYWORD*keyword + W_TYPE*type + W_RECENCY*recency + W_IMPORTANCE*importance
const W = {
  keyword: 0.4,
  type: 0.2,
  recency: 0.2,
  importance: 0.15,
  cosine: 0.05, // unused unless embeddings present
};

// When embeddings are present we lean on semantic similarity and rebalance.
const W_EMB = {
  keyword: 0.2,
  type: 0.15,
  recency: 0.1,
  importance: 0.1,
  cosine: 0.45,
};

// Recency half-life in days — a memory 30 days old scores ~0.37, 60 days ~0.14.
const RECENCY_HALFLIFE_DAYS = 30;

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "i", "im", "ive", "you", "your",
  "to", "of", "in", "on", "for", "with", "at", "by", "is", "are", "was",
  "were", "be", "been", "my", "me", "we", "they", "it", "this", "that",
  "have", "has", "had", "do", "does", "did", "will", "would", "should",
  "can", "could", "if", "so", "as", "from", "about", "into", "over",
]);

/**
 * Tokenize a string into a Set of lowercase word tokens, dropping stopwords
 * and non-word fragments. Kept simple — no stemming (the structured memory
 * types + tags carry most of the signal).
 * @param {string} text
 * @returns {Set<string>}
 */
export function tokenize(text) {
  if (!text) return new Set();
  const tokens = new Set();
  const matches = String(text).toLowerCase().match(/[a-z0-9+#.]+/g) || [];
  for (const t of matches) {
    if (t.length < 2 || STOPWORDS.has(t)) continue;
    tokens.add(t);
  }
  return tokens;
}

/**
 * Jaccard similarity between two token sets: |A ∩ B| / |A ∪ B|.
 * Returns 0 for empty inputs.
 * @param {Set<string>} a
 * @param {Set<string>} b
 * @returns {number}
 */
export function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  const union = a.size + b.size - inter;
  return union ? inter / union : 0;
}

/**
 * Keyword overlap between a query and a memory's content + tags.
 * @param {Set<string>} queryTokens
 * @param {string} content
 * @param {string[]} tags
 * @returns {number} 0..1 (Jaccard)
 */
export function keywordScore(queryTokens, content, tags = []) {
  if (!queryTokens.size) return 0;
  const memTokens = tokenize(content);
  for (const tag of tags) {
    const tagTokens = tokenize(tag);
    for (const t of tagTokens) memTokens.add(t);
  }
  return jaccard(queryTokens, memTokens);
}

/**
 * Type intent weight. `typeWeights` is an optional map { memoryType: 0..1 }
 * passed by the Coordinator based on the classified intent (e.g. an
 * interview_prep intent up-weights `interview` + `skill` memories).
 * @param {string} type
 * @param {Record<string, number>} [typeWeights]
 * @returns {number}
 */
export function typeScore(type, typeWeights) {
  if (!typeWeights) return 0.5; // uniform default
  const v = typeWeights[type];
  return typeof v === "number" ? v : 0.25; // unmentioned types get a small floor
}

/**
 * Exponential recency decay. `updatedAt` is a Date or ISO string.
 * @param {Date|string} when
 * @returns {number} 0..1
 */
export function recencyScore(when) {
  if (!when) return 0;
  const daysOld = (Date.now() - new Date(when).getTime()) / (1000 * 60 * 60 * 24);
  if (Number.isNaN(daysOld) || daysOld < 0) return 1;
  return Math.exp(-daysOld / RECENCY_HALFLIFE_DAYS);
}

/**
 * Clamp a number to [0,1].
 * @param {number} n
 * @returns {number}
 */
export function clamp01(n) {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

/**
 * Cosine similarity between two equal-length numeric vectors (Float[]).
 * Tolerates Json-stored vectors (numbers). Returns 0 for empty/unequal.
 * @param {number[]|null} a
 * @param {number[]|null} b
 * @returns {number} -1..1 (clamped to 0..1 by callers via (cos+1)/2)
 */
export function cosine(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length || !a.length) {
    return 0;
  }
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    const x = Number(a[i]);
    const y = Number(b[i]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return 0;
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/**
 * Score a single memory against a query.
 *
 * @param {object} args
 * @param {object} args.memory - a MemoryEntry row (needs content, tags, type, importance, updatedAt, embedding?)
 * @param {Set<string>} args.queryTokens - tokenized query
 * @param {Record<string, number>} [args.typeWeights] - intent-driven type weights
 * @param {number[]|null} [args.queryEmbedding] - optional query vector (when embeddings enabled)
 * @returns {number} 0..1 relevance score
 */
export function scoreMemory({ memory, queryTokens, typeWeights, queryEmbedding }) {
  const kw = keywordScore(queryTokens, memory.content, memory.tags);
  const ty = typeScore(memory.type, typeWeights);
  const rc = recencyScore(memory.updatedAt);
  const im = clamp01(memory.importance ?? 0.5);

  // Embedding path: blend cosine if both vectors present.
  if (queryEmbedding && Array.isArray(memory.embedding) && memory.embedding.length) {
    const cos = (cosine(queryEmbedding, memory.embedding) + 1) / 2; // map -1..1 -> 0..1
    const w = W_EMB;
    return clamp01(
      w.keyword * kw + w.type * ty + w.recency * rc + w.importance * im + w.cosine * cos
    );
  }

  const w = W;
  return clamp01(
    w.keyword * kw + w.type * ty + w.recency * rc + w.importance * im
  );
}

export const RELEVANCE_WEIGHTS = { default: W, embeddings: W_EMB };