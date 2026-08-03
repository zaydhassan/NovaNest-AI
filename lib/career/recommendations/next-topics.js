/**
 * Next-topics recommendation (M9) — pure function that suggests the next
 * skills/topics a user should learn, ranked by relevance to their active goal
 * + industry + skill gaps. No IO; the recommendation-service gathers inputs.
 *
 * Inputs are intentionally tolerant of missing pieces so it degrades gracefully
 * on a fresh account (no goal → industry-recommended skills; no insights →
 * memory-derived skills).
 *
 * Server-only (re-exported via the barrel).
 */

const norm = (s) => String(s ?? "").toLowerCase().trim();

/**
 * @param {{ goal?: { targetRole?: string, targetLevel?: string } | null, skills?: string[], memorySkills?: string[], weaknesses?: string[], existingTopics?: string[], recommendedSkills?: string[], topSkills?: string[], company?: { displayName?: string, topSkills?: string[], recommendedSkills?: string[] } | null }} ctx
 * @returns {Array<{ skill: string, why: string, priority: number }>}
 */
export function recommendNextTopics(ctx = {}) {
  const known = new Set(
    [...(ctx.skills || []), ...(ctx.memorySkills || [])].map(norm).filter(Boolean)
  );
  const haveTopic = new Set((ctx.existingTopics || []).map(norm).filter(Boolean));
  const seen = new Set();

  const candidates = []; // { skill, why, priority }
  const add = (skill, why, priority) => {
    const s = norm(skill);
    if (!s || seen.has(s) || known.has(s) || haveTopic.has(s)) return;
    seen.add(s);
    candidates.push({ skill: titleCase(s), why, priority });
  };

  // 1. Mock-interview weaknesses — highest signal (the user is actively
  //    being told to improve these).
  for (const w of (ctx.weaknesses || []).slice(0, 8)) {
    add(w, "Flagged as a growth area in your mock interviews.", 100);
  }

  // 2. Dream Company — skills the user's target company emphasizes (sits
  //    between weaknesses and the industry-recommended source). Only when a
  //    target company is set; `ctx.company` undefined → this block is skipped,
  //    so the output is byte-identical to the no-company baseline.
  if (ctx.company) {
    const companyName = ctx.company.displayName || "your target company";
    for (const s of (ctx.company.recommendedSkills || []).slice(0, 12)) {
      add(s, `Emphasized by ${companyName} — aligns with its hiring bar.`, 90);
    }
    for (const s of (ctx.company.topSkills || []).slice(0, 10)) {
      add(s, `A top skill ${companyName} hires for.`, 70);
    }
  }

  // 3. Industry-recommended skills not yet known (strong goal-independent signal).
  for (const s of (ctx.recommendedSkills || []).slice(0, 12)) {
    add(s, `In-demand for your industry${ctx.goal?.targetRole ? ` and the ${ctx.goal.targetRole} track` : ""}.`, 80);
  }

  // 4. Top skills for the industry (slightly lower priority than recommended).
  for (const s of (ctx.topSkills || []).slice(0, 10)) {
    add(s, "Widely asked for in your industry.", 60);
  }

  // Sort by priority desc, then keep the top 8.
  candidates.sort((a, b) => b.priority - a.priority);
  return candidates.slice(0, 8);
}

function titleCase(s) {
  return s
    .split(/\s+/)
    .map((w) => (w.length <= 2 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}