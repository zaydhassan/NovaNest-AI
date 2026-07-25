/**
 * Per-source memory extractors. Each turns one piece of user activity into
 * MemoryEntry specs and writes them idempotently via `MemoryService.extractAndWrite`
 * (which dedupes on userId+source+sourceId+content).
 *
 * Two flavors:
 *  - Pure (no Gemini): fromResume / fromApplication / fromMock / fromQuiz /
 *    fromOnboarding. They derive memories from already-AI-generated or
 *    user-supplied data. Cheap, deterministic, safe to run inside any tx.
 *  - AI-driven: fromChat. Calls Gemini to pull durable facts out of a chat
 *    turn. Used by the Coach `sendMessage` flow (M5).
 *
 * All extractors are best-effort: the caller wraps them in `.catch()` (or runs
 * them inside an existing tx) so a memory failure never breaks the primary
 * action — mirroring how `bumpActivity` / `createNotification` are already used.
 *
 * Server-only.
 */
import { generateJSON } from "@/lib/ai/gemini";
import { buildPrompt } from "@/lib/career/prompts/prompt-service";
import { extractAndWrite } from "@/lib/career/memory/memory-service";

const clampImp = (n) => (Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0.5);

/** Split a skill string/array into a deduped trimmed tag list. */
function toSkills(skills) {
  if (!skills) return [];
  if (Array.isArray(skills)) return skills.map((s) => String(s).trim()).filter(Boolean);
  return String(skills)
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Resume → identity + skill memories. Pure. Run after saveResume.
 * @param {string} userId
 * @param {{ id: string, content: string, atsScore?: number|null }} resume
 * @param {any} [tx]
 */
export async function fromResume(userId, resume, tx) {
  if (!resume?.content) return [];
  // Pull obvious skills out of the resume markdown (## Skills sections, etc.).
  const skillLine = resume.content.match(/^#{0,6}\s*skills?\s*\n(.+)/im)?.[1] ?? "";
  const skills = toSkills(skillLine).slice(0, 30);

  const memories = [
    {
      type: "identity",
      content: `Saved resume${resume.atsScore != null ? ` — ATS score ${Math.round(resume.atsScore)}%` : ""}.`,
      tags: ["resume"],
      importance: 0.4,
    },
  ];
  for (const skill of skills) {
    memories.push({
      type: "skill",
      content: `Knows ${skill}.`,
      tags: [skill.toLowerCase(), "skill"],
      importance: 0.6,
    });
  }
  return extractAndWrite({ userId, source: "resume", sourceId: resume.id, memories }, tx);
}

/**
 * Application → one application memory (+ role-derived skill tags). Pure.
 * Run after createApplication. Content is status-stable so re-extracts are
 * no-ops; offer/rejection signal is captured by the timeline (M3).
 * @param {string} userId
 * @param {{ id: string, company: string, role: string, status?: string }} app
 * @param {any} [tx]
 */
export async function fromApplication(userId, app, tx) {
  if (!app?.id) return [];
  const tags = ["application", String(app.company).toLowerCase()];
  const roleWords = toSkills(String(app.role || "").replace(/[\-/]/g, " "));
  for (const w of roleWords.slice(0, 3)) tags.push(w.toLowerCase());
  return extractAndWrite(
    {
      userId,
      source: "application",
      sourceId: app.id,
      memories: [
        {
          type: "application",
          content: `Applied to ${app.company} for ${app.role}.`,
          tags: Array.from(new Set(tags)),
          importance: 0.7,
        },
      ],
    },
    tx
  );
}

/**
 * Mock interview → an interview memory (strengths/weaknesses/score) + skill
 * memories for the weak topics. Pure (uses the AI-generated score result).
 * Run after scoreMockInterview.
 * @param {string} userId
 * @param {{ id: string, role: string }} mock
 * @param {{ score?: number, strengths?: string[], improvements?: string[] }} scoreResult
 * @param {any} [tx]
 */
export async function fromMock(userId, mock, scoreResult, tx) {
  if (!mock?.id) return [];
  const r = scoreResult || {};
  const score = Number.isFinite(r.score) ? Math.round(r.score) : null;
  const strengths = Array.isArray(r.strengths) ? r.strengths : [];
  const improvements = Array.isArray(r.improvements) ? r.improvements : [];

  const memories = [
    {
      type: "interview",
      content:
        `Mock interview (${mock.role})${score != null ? ` — scored ${score}/100` : ""}. ` +
        (strengths.length ? `Strengths: ${strengths.join("; ")}. ` : "") +
        (improvements.length ? `To improve: ${improvements.join("; ")}.` : "").trim(),
      tags: ["interview", String(mock.role).toLowerCase()],
      importance: 0.85,
    },
  ];
  // Each improvement is a weakness worth remembering as a skill gap.
  for (const imp of improvements.slice(0, 6)) {
    const tag = String(imp).toLowerCase().split(/\s+/).slice(0, 3).join(" ");
    memories.push({
      type: "skill",
      content: `Working on: ${imp} (flagged in ${mock.role} mock).`,
      tags: [tag, "weakness", "interview"],
      importance: 0.7,
    });
  }
  return extractAndWrite({ userId, source: "mock", sourceId: mock.id, memories }, tx);
}

/**
 * Quiz assessment → a learning memory (category, score, weak area). Pure.
 * Run after saveQuizResult.
 * @param {string} userId
 * @param {{ id: string, category: string, quizScore: number, improvementTip?: string|null }} assessment
 * @param {any} [tx]
 */
export async function fromQuiz(userId, assessment, tx) {
  if (!assessment?.id) return [];
  const memories = [
    {
      type: "learning",
      content:
        `Quiz (${assessment.category}) — scored ${Math.round(assessment.quizScore)}%.` +
        (assessment.improvementTip ? ` Focus: ${assessment.improvementTip}` : ""),
      tags: ["quiz", String(assessment.category).toLowerCase()],
      importance: 0.55,
    },
  ];
  return extractAndWrite({ userId, source: "quiz", sourceId: assessment.id, memories }, tx);
}

/**
 * Onboarding → an identity memory (industry, experience, skills) + skill
 * memories. Pure. Run inside the updateUser tx so it commits atomically.
 * @param {string} userId
 * @param {{ industry?: string, experience?: number, skills?: string[], bio?: string }} data
 * @param {any} [tx]
 */
export async function fromOnboarding(userId, data, tx) {
  if (!data) return [];
  const skills = toSkills(data.skills);
  const memories = [
    {
      type: "identity",
      content:
        `Industry: ${data.industry ?? "unknown"}. ` +
        (data.experience != null ? `Experience: ${data.experience} years. ` : "") +
        (data.bio ? `Bio: ${String(data.bio).slice(0, 280)}.` : "").trim(),
      tags: ["identity", "onboarding", String(data.industry ?? "").toLowerCase()].filter(
        Boolean
      ),
      importance: 0.8,
    },
  ];
  for (const skill of skills.slice(0, 30)) {
    memories.push({
      type: "skill",
      content: `Knows ${skill}.`,
      tags: [skill.toLowerCase(), "skill"],
      importance: 0.6,
    });
  }
  return extractAndWrite({ userId, source: "onboarding", memories }, tx);
}

/**
 * A learning session → a learning memory (what the user practiced + outcome)
 * + a skill memory for the touched topic. Pure (uses the session summary the
 * user/agent recorded). Run after logLearningSession.
 * @param {string} userId
 * @param {{ id: string, kind: string, summary?: string|null, durationMin?: number|null, topic?: { skill: string }|null }} session
 * @param {any} [tx]
 */
export async function fromLearning(userId, session, tx) {
  if (!session?.id) return [];
  const skill = session.topic?.skill;
  const memories = [
    {
      type: "learning",
      content:
        `Practiced${skill ? ` ${skill}` : ""} (${session.kind}).` +
        (session.summary ? ` ${String(session.summary).slice(0, 280)}` : "") +
        (session.durationMin ? ` (${session.durationMin} min)` : ""),
      tags: ["learning", session.kind, skill?.toLowerCase()].filter(Boolean),
      importance: 0.6,
    },
  ];
  if (skill) {
    memories.push({
      type: "skill",
      content: `Practiced ${skill} in a ${session.kind} session.`,
      tags: [skill.toLowerCase(), "learning", session.kind],
      importance: 0.65,
    });
  }
  return extractAndWrite({ userId, source: "learning", sourceId: session.id, memories }, tx);
}

/**
 * A set/updated active career goal → a career memory capturing the target.
 * Pure. Run after setCareerGoal. Idempotent on the goal id; updating the goal
 * re-derives a new memory (different content) so the latest intent is recalled.
 * @param {string} userId
 * @param {{ id: string, targetRole: string, targetLevel?: string|null, timeframe?: string|null }} goal
 * @param {any} [tx]
 */
export async function fromGoal(userId, goal, tx) {
  if (!goal?.id) return [];
  return extractAndWrite(
    {
      userId,
      source: "onboarding", // grouped with identity/career intent; goal id keeps it unique
      sourceId: goal.id,
      memories: [
        {
          type: "career",
          content:
            `Career goal: ${goal.targetRole}` +
            (goal.targetLevel ? ` (${goal.targetLevel})` : "") +
            (goal.timeframe ? ` within ${goal.timeframe}` : "") +
            ".",
          tags: ["goal", "career", String(goal.targetRole).toLowerCase()],
          importance: 0.85,
        },
      ],
    },
    tx
  );
}

/**
 * Chat → AI-driven extraction of durable facts from a user+assistant turn.
 * Used by the Coach sendMessage flow (M5). Filters trivia via the prompt.
 * @param {string} userId
 * @param {{ id: string }} sourceRow - the ChatMessage row (user message)
 * @param {string} userText
 * @param {string} [assistantText]
 * @param {any} [tx]
 */
export async function fromChat(userId, sourceRow, userText, assistantText, tx) {
  if (!userText || userText.length < 3) return [];
  let parsed;
  try {
    parsed = await generateJSON(
      buildPrompt("chatMemoryExtraction", { userText, assistantText })
    );
  } catch (err) {
    console.error("[memory-extractors.fromChat] extraction failed:", err?.message);
    return [];
  }
  const memories = Array.isArray(parsed?.memories)
    ? parsed.memories.map((m) => ({
        type: String(m.type),
        content: String(m.content ?? "").slice(0, 4000),
        tags: Array.isArray(m.tags) ? m.tags.map(String) : [],
        importance: clampImp(Number(m.importance)),
      })).filter((m) => m.type && m.content)
    : [];
  if (!memories.length) return [];
  return extractAndWrite(
    { userId, source: "chat", sourceId: sourceRow?.id, memories },
    tx
  );
}

/**
 * GitHub repo analysis → a project memory + skill memories for the repo's
 * language + a github memory with the senior-review grade. Pure (uses the
 * already-generated analysis JSON). Run after the Inngest analyze-github-repo
 * job completes.
 * @param {string} userId
 * @param {{ id: string, fullName: string, language?: string|null, analysis?: any }} repo
 * @param {any} [tx]
 */
export async function fromGitHub(userId, repo, tx) {
  if (!repo?.id) return [];
  const analysis = repo?.analysis && typeof repo.analysis === "object" ? repo.analysis : {};
  const memories = [
    {
      type: "project",
      content:
        `Built ${repo.fullName}${repo.language ? ` (${repo.language})` : ""}.` +
        (analysis?.summary ? ` ${String(analysis.summary).slice(0, 280)}` : "") +
        (analysis?.grade ? ` Senior review grade: ${analysis.grade}.` : ""),
      tags: ["project", "github", String(repo.fullName).toLowerCase()],
      importance: 0.75,
    },
    {
      type: "github",
      content:
        `GitHub repo ${repo.fullName} analyzed` +
        (analysis?.grade ? ` — grade ${analysis.grade}` : "") +
        (analysis?.highlights?.length
          ? `. Highlights: ${analysis.highlights.slice(0, 3).join("; ")}.`
          : ""),
      tags: ["github", String(repo.fullName).toLowerCase()],
      importance: 0.6,
    },
  ];
  if (repo.language) {
    memories.push({
      type: "skill",
      content: `Builds projects in ${repo.language}.`,
      tags: [String(repo.language).toLowerCase(), "skill"],
      importance: 0.6,
    });
  }
  return extractAndWrite({ userId, source: "github", sourceId: repo.id, memories }, tx);
}