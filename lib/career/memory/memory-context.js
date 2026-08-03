/**
 * Memory Context — renders retrieved memories into a prompt context block.
 *
 * `renderMemoryContextBlock(sections)` returns a string the chat route prepends
 * to the synthesis prompt. Returns "" when there are no items, so the injection
 * site can no-op cleanly (existing prompt byte-identical → no behavior change).
 *
 * The block is grouped by section in the order the intent router declares, with
 * a token-budget cap so the prompt never grows unbounded. Pure: no DB, no IO.
 */
import { SECTION_LABELS } from "@/lib/career/memory/retrieval-router";

const MAX_TOTAL_CHARS = 2000;
const MAX_PER_SECTION = 4;
const MAX_ITEM_CHARS = 160;
const HEADER = "=== RELEVANT MEMORIES (NovaNest Memory Engine) ===\nUse these to ground your answer. Do not invent facts the user has not shared; if a memory is missing, say so.\n";

/**
 * Group flat items into ordered sections.
 * @param {Array} items - normalized items (each has `section`)
 * @param {string[]} sectionOrder - ordered section keys
 * @returns {Array<{ section: string, label: string, items: Array }>}
 */
export function groupItemsBySection(items, sectionOrder) {
  const buckets = {};
  for (const it of items) {
    const key = it.section || "relevant_memories";
    (buckets[key] ??= []).push(it);
  }
  const sections = [];
  for (const key of sectionOrder) {
    if (buckets[key]?.length) {
      sections.push({ section: key, label: SECTION_LABELS[key] || key, items: buckets[key] });
    }
  }
  // Any section not in the declared order (shouldn't happen, but be safe).
  for (const key of Object.keys(buckets)) {
    if (!sectionOrder.includes(key)) {
      sections.push({ section: key, label: SECTION_LABELS[key] || key, items: buckets[key] });
    }
  }
  return sections;
}

function truncate(s, n) {
  const str = String(s ?? "").trim();
  return str.length > n ? str.slice(0, n - 1).trimEnd() + "…" : str;
}

function renderItemLine(item) {
  const head = truncate(item.title, 80);
  const body = truncate(item.summary, MAX_ITEM_CHARS - head.length);
  return body ? `- ${head} — ${body}` : `- ${head}`;
}

/**
 * Render the grouped sections into the prompt block string.
 * @param {Array<{ section: string, label: string, items: Array }>} sections
 * @returns {string} "" if no items, else the header + grouped bullets
 */
export function renderMemoryContextBlock(sections) {
  if (!sections?.length) return "";
  const totalItems = sections.reduce((n, s) => n + s.items.length, 0);
  if (!totalItems) return "";

  let out = HEADER;
  let used = out.length;
  for (const s of sections) {
    const taken = s.items.slice(0, MAX_PER_SECTION);
    const sectionHead = `\n## ${s.label}\n`;
    if (used + sectionHead.length > MAX_TOTAL_CHARS) break;
    out += sectionHead;
    used += sectionHead.length;
    for (const item of taken) {
      const line = renderItemLine(item) + "\n";
      if (used + line.length > MAX_TOTAL_CHARS) break;
      out += line;
      used += line.length;
    }
  }
  return out;
}

/**
 * Build a compact manifest for the UI preview / chat drawer header. No heavy
 * payloads — just enough to render chips + section counts.
 * @param {string} intent
 * @param {Array<{ section: string, label: string, items: Array }>} sections
 */
export function buildManifest(intent, sections) {
  const sources = sections.map((s) => ({
    section: s.section,
    label: s.label,
    count: s.items.length,
    items: s.items.map((it) => ({ id: it.id, kind: it.kind, title: it.title, summary: it.summary })),
  }));
  const citations = sections.flatMap((s) =>
    s.items.map((it) => ({ id: it.id, kind: it.kind, section: s.section, label: it.title }))
  );
  return { intent, sources, citations, totalItems: citations.length };
}