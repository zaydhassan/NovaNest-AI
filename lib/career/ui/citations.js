
const SNIPPET_LEN = 200;

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

export function stripCitations(reply) {
  return String(reply ?? "").replace(MARKER_RE, "").replace(/\s{2,}/g, " ").trim();
}