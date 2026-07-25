/**
 * Citation helpers for the Coach chat surface (M5).
 *
 * The Coordinator injects a numbered list of recalled memories into the
 * synthesis prompt and instructs the model to ground claims with [n] markers.
 * These pure helpers build that numbered block and, after the reply streams,
 * map the [n] markers back to the memory rows so the UI can render memory
 * chips under the message.
 *
 * Pure + isomorphic — safe to import from client or server.
 */

const SNIPPET_LEN = 200;

/**
 * Build a numbered citation block from recalled memories.
 *
 * @param {Array<{id: string, type: string, content: string, tags?: string[], importance?: number}>} memories
 * @returns {{ blocks: Array<{index: number, id: string, type: string, snippet: string, tags: string[]}>, promptText: string }}
 */
export function buildMemoryBlocks(memories = []) {
  const blocks = memories.map((m, i) => ({
    index: i + 1,
    id: m.id,
    type: m.type,
    snippet: String(m.content ?? "").slice(0, SNIPPET_LEN),
    tags: Array.isArray(m.tags) ? m.tags : [],
  }));

  if (!blocks.length) return { blocks: [], promptText: "" };

  const promptText =
    "RELEVANT LONG-TERM MEMORY (ground your answer in these; cite as [n]):\n" +
    blocks
      .map(
        (b) =>
          `[${b.index}] (${b.type}${b.tags.length ? `, ${b.tags.slice(0, 4).join(", ")}` : ""}) ${b.snippet}`
      )
      .join("\n");

  return { blocks, promptText };
}

const MARKER_RE = /\[(\d{1,2})\]/g;

/**
 * Parse the [n] markers actually used in the streamed reply and map them to
 * memory blocks. Returns the cited blocks in first-use order, deduped.
 *
 * @param {string} reply
 * @param {Array<{index: number, id: string, type: string, snippet: string, tags: string[]}>} blocks
 * @returns {Array<{index: number, id: string, type: string, snippet: string, tags: string[]}>}
 */
export function parseCitations(reply, blocks = []) {
  if (!reply || !blocks.length) return [];
  const byIndex = new Map(blocks.map((b) => [b.index, b]));
  const seen = new Set();
  const out = [];
  let match;
  MARKER_RE.lastIndex = 0;
  while ((match = MARKER_RE.exec(reply))) {
    const idx = Number(match[1]);
    if (seen.has(idx)) continue;
    const b = byIndex.get(idx);
    if (b) {
      seen.add(idx);
      out.push(b);
    }
  }
  return out;
}

/**
 * Strip [n] markers from a reply for a clean read-only view (e.g. timeline
 * excerpt). Leaves the surrounding text intact.
 */
export function stripCitations(reply) {
  return String(reply ?? "").replace(MARKER_RE, "").replace(/\s{2,}/g, " ").trim();
}