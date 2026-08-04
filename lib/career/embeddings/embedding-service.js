import { generateJSON } from "@/lib/ai/gemini";
import { cosine } from "@/lib/career/memory/relevance";

export const EMBEDDINGS_ENABLED = process.env.EMBEDDINGS_ENABLED === "true";

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

export { cosine };

function embeddingPrompt(text) {
  return `Return ONLY this JSON, no other text:
{ "embedding": [number, ...] }

Produce a 768-dimensional unit embedding vector for the text below, suitable
for cosine-similarity semantic search over career memory:

${String(text).slice(0, 4000)}
`;
}