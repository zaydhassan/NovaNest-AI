
const W = {
  keyword: 0.4,
  type: 0.2,
  recency: 0.2,
  importance: 0.15,
  cosine: 0.05,
};

const W_EMB = {
  keyword: 0.2,
  type: 0.15,
  recency: 0.1,
  importance: 0.1,
  cosine: 0.45,
};

const RECENCY_HALFLIFE_DAYS = 30;

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "i", "im", "ive", "you", "your",
  "to", "of", "in", "on", "for", "with", "at", "by", "is", "are", "was",
  "were", "be", "been", "my", "me", "we", "they", "it", "this", "that",
  "have", "has", "had", "do", "does", "did", "will", "would", "should",
  "can", "could", "if", "so", "as", "from", "about", "into", "over",
]);

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

export function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  const union = a.size + b.size - inter;
  return union ? inter / union : 0;
}

export function keywordScore(queryTokens, content, tags = []) {
  if (!queryTokens.size) return 0;
  const memTokens = tokenize(content);
  for (const tag of tags) {
    const tagTokens = tokenize(tag);
    for (const t of tagTokens) memTokens.add(t);
  }
  return jaccard(queryTokens, memTokens);
}

export function typeScore(type, typeWeights) {
  if (!typeWeights) return 0.5;
  const v = typeWeights[type];
  return typeof v === "number" ? v : 0.25;
}

export function recencyScore(when) {
  if (!when) return 0;
  const daysOld = (Date.now() - new Date(when).getTime()) / (1000 * 60 * 60 * 24);
  if (Number.isNaN(daysOld) || daysOld < 0) return 1;
  return Math.exp(-daysOld / RECENCY_HALFLIFE_DAYS);
}

export function clamp01(n) {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

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

export function scoreMemory({ memory, queryTokens, typeWeights, queryEmbedding }) {
  const kw = keywordScore(queryTokens, memory.content, memory.tags);
  const ty = typeScore(memory.type, typeWeights);
  const rc = recencyScore(memory.updatedAt);
  const im = clamp01(memory.importance ?? 0.5);

  if (queryEmbedding && Array.isArray(memory.embedding) && memory.embedding.length) {
    const cos = (cosine(queryEmbedding, memory.embedding) + 1) / 2;
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