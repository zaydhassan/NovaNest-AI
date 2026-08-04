
const norm = (s) => String(s ?? "").toLowerCase().trim();

export function recommendNextTopics(ctx = {}) {
  const known = new Set(
    [...(ctx.skills || []), ...(ctx.memorySkills || [])].map(norm).filter(Boolean)
  );
  const haveTopic = new Set((ctx.existingTopics || []).map(norm).filter(Boolean));
  const seen = new Set();

  const candidates = [];
  const add = (skill, why, priority) => {
    const s = norm(skill);
    if (!s || seen.has(s) || known.has(s) || haveTopic.has(s)) return;
    seen.add(s);
    candidates.push({ skill: titleCase(s), why, priority });
  };

  for (const w of (ctx.weaknesses || []).slice(0, 8)) {
    add(w, "Flagged as a growth area in your mock interviews.", 100);
  }

  if (ctx.company) {
    const companyName = ctx.company.displayName || "your target company";
    for (const s of (ctx.company.recommendedSkills || []).slice(0, 12)) {
      add(s, `Emphasized by ${companyName} — aligns with its hiring bar.`, 90);
    }
    for (const s of (ctx.company.topSkills || []).slice(0, 10)) {
      add(s, `A top skill ${companyName} hires for.`, 70);
    }
  }

  for (const s of (ctx.recommendedSkills || []).slice(0, 12)) {
    add(s, `In-demand for your industry${ctx.goal?.targetRole ? ` and the ${ctx.goal.targetRole} track` : ""}.`, 80);
  }

  for (const s of (ctx.topSkills || []).slice(0, 10)) {
    add(s, "Widely asked for in your industry.", 60);
  }

  candidates.sort((a, b) => b.priority - a.priority);
  return candidates.slice(0, 8);
}

function titleCase(s) {
  return s
    .split(/\s+/)
    .map((w) => (w.length <= 2 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}