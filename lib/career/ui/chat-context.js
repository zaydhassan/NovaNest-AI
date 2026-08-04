
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const ellipsize = (s, n = 600) => (String(s ?? "").length > n ? String(s).slice(0, n) + "…" : String(s ?? ""));

export function summarizeMemory(memories = [], max = 10) {
  if (!memories.length) return "(no relevant memories yet)";
  return memories
    .slice(0, max)
    .map((m) => `- (${m.type}) ${ellipsize(m.content, 220)}`)
    .join("\n");
}

export function buildUserProfile(user = {}, extras = {}) {
  const skills = Array.isArray(user.skills) ? user.skills : [];
  return [
    `Industry: ${user.industry ?? "unknown"}`,
    user.experience != null ? `Experience: ${user.experience} years` : null,
    skills.length ? `Skills: ${skills.slice(0, 15).join(", ")}` : null,
    user.bio ? `Bio: ${ellipsize(user.bio, 300)}` : null,
    extras.targetRole ? `Target role: ${extras.targetRole}` : null,
    extras.healthScore != null ? `Career Health: ${clamp(extras.healthScore, 0, 100)}/100` : null,
    extras.readinessScore != null ? `Interview readiness: ${clamp(extras.readinessScore, 0, 100)}/100` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildAgentDigest(results = []) {
  if (!results.length) return "(no specialist agents contributed)";
  return results
    .map((r) => {
      const head = `### ${r.agentId}`;
      const sum = r.summary ? ellipsize(r.summary, 280) : "";
      const bullets = Array.isArray(r.bullets) && r.bullets.length
        ? r.bullets.slice(0, 6).map((b) => `- ${ellipsize(b, 200)}`).join("\n")
        : "";
      return [head, sum, bullets].filter(Boolean).join("\n");
    })
    .join("\n\n");
}

export function buildChatContext({ user = {}, memories = [], agentResults = [], extras = {} } = {}) {
  const profile = buildUserProfile(user, extras);
  const memorySummary = summarizeMemory(memories);
  const agentDigest = buildAgentDigest(agentResults);
  const promptText =
    `USER PROFILE\n${profile}\n\n` +
    `RECALLED MEMORY\n${memorySummary}\n\n` +
    `AGENT FINDINGS\n${agentDigest}`;
  return { profile, memorySummary, agentDigest, promptText };
}