import { db } from "@/lib/prisma";
import { tokenize, scoreMemory } from "@/lib/career/memory/relevance";
import { KIND_TO_SECTION } from "@/lib/career/memory/retrieval-router";

const CANDIDATE_POOL = 120;

export async function searchStructuredMemories({
  userId,
  queryTokens,
  categories,
  limit = 10,
}) {
  if (!categories?.length) return [];
  const rows = await db.structuredMemory.findMany({
    where: { userId, isArchived: false, category: { in: categories } },
    orderBy: [{ importance: "desc" }, { updatedAt: "desc" }],
    take: CANDIDATE_POOL,
  });
  if (!rows.length) return [];

  const scored = rows.map((m) => {
    const content = [m.title, m.summary, m.detail]
      .filter(Boolean)
      .join(" ");
    const type = m.category;
    const score = scoreMemory({
      memory: { content, tags: m.tags, type, importance: m.importance, updatedAt: m.updatedAt },
      queryTokens,
    });
    return {
      kind: `structured_${m.category}`,
      id: m.id,
      category: m.category,
      title: m.title,
      summary: m.summary ?? "",
      detail: m.detail ?? "",
      tags: m.tags ?? [],
      importance: m.importance ?? 0.5,
      type,
      content,
      updatedAt: m.updatedAt,
      linkedType: m.linkedType,
      linkedId: m.linkedId,
      payload: m.structured ?? {},
      score,
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => ({
    ...s,
    section: KIND_TO_SECTION[s.kind] || "relevant_memories",
  }));
}

export async function fetchDedicatedSources({ userId, intent, entities }) {
  const jobs = [];

  if (intent === "interview") {
    jobs.push(
      db.mockInterview.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true, role: true, industry: true, score: true, feedback: true,
          strengths: true, improvements: true, createdAt: true,
        },
      }).then((r) => r.map(normMockInterview)),
      db.assessment.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 4,
        select: { id: true, category: true, quizScore: true, improvementTip: true, createdAt: true },
      }).then((r) => r.map(normAssessment)),
      db.resume.findUnique({
        where: { userId },
        select: { id: true, content: true, atsScore: true, updatedAt: true },
      }).then((r) => (r ? [normResume(r)] : [])),
      db.learningTopic.findMany({
        where: { userId, status: { in: ["needs_review", "learning"] } },
        orderBy: [{ proficiency: "asc" }, { lastTouchedAt: "desc" }],
        take: 5,
        select: { id: true, skill: true, status: true, proficiency: true, notes: true, lastTouchedAt: true, updatedAt: true },
      }).then((r) => r.map(normLearningTopic)),
      db.careerGoal.findFirst({
        where: { userId, status: "active" },
        select: { id: true, targetRole: true, targetLevel: true, timeframe: true, rationale: true, updatedAt: true },
      }).then((r) => (r ? [normCareerGoal(r)] : [])),
      entities?.companies?.length
        ? db.application.findMany({
            where: { userId, OR: entities.companies.flatMap((c) => [
                { company: { contains: c, mode: "insensitive" } },
                { role: { contains: c, mode: "insensitive" } },
              ]) },
            orderBy: { appliedAt: "desc" },
            take: 3,
            select: { id: true, company: true, role: true, status: true, notes: true, appliedAt: true, updatedAt: true },
          }).then((r) => r.map(normApplication))
        : Promise.resolve([])
    );
  } else if (intent === "application") {
    jobs.push(
      db.application.findMany({
        where: { userId },
        orderBy: { appliedAt: "desc" },
        take: 6,
        select: { id: true, company: true, role: true, status: true, notes: true, appliedAt: true, updatedAt: true },
      }).then((r) => r.map(normApplication)),
      db.resume.findUnique({
        where: { userId },
        select: { id: true, content: true, atsScore: true, updatedAt: true },
      }).then((r) => (r ? [normResume(r)] : []))
    );
  } else if (intent === "resume") {
    jobs.push(
      db.resume.findUnique({
        where: { userId },
        select: { id: true, content: true, atsScore: true, updatedAt: true },
      }).then((r) => (r ? [normResume(r)] : [])),
      db.assessment.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: { id: true, category: true, quizScore: true, improvementTip: true, createdAt: true },
      }).then((r) => r.map(normAssessment)),
      db.gitHubRepo.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        take: 3,
        select: { id: true, fullName: true, language: true, analysisStatus: true, updatedAt: true },
      }).then((r) => r.map(normGithubRepo))
    );
  } else if (intent === "learning") {
    jobs.push(
      db.learningTopic.findMany({
        where: { userId },
        orderBy: [{ lastTouchedAt: "desc" }],
        take: 6,
        select: { id: true, skill: true, status: true, proficiency: true, notes: true, lastTouchedAt: true, updatedAt: true },
      }).then((r) => r.map(normLearningTopic)),
      db.assessment.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: { id: true, category: true, quizScore: true, improvementTip: true, createdAt: true },
      }).then((r) => r.map(normAssessment))
    );
  } else if (intent === "goal") {
    jobs.push(
      db.careerGoal.findFirst({
        where: { userId, status: "active" },
        select: { id: true, targetRole: true, targetLevel: true, timeframe: true, rationale: true, updatedAt: true },
      }).then((r) => (r ? [normCareerGoal(r)] : [])),
      db.learningTopic.findMany({
        where: { userId },
        orderBy: [{ proficiency: "asc" }],
        take: 5,
        select: { id: true, skill: true, status: true, proficiency: true, notes: true, lastTouchedAt: true, updatedAt: true },
      }).then((r) => r.map(normLearningTopic))
    );
  }

  const results = (await Promise.all(jobs.map((j) => j.catch(() => [])))).flat();
  return results.map((r) => ({ ...r, section: KIND_TO_SECTION[r.kind] || "relevant_memories" }));
}


function normMockInterview(m) {
  const improvements = Array.isArray(m.improvements) ? m.improvements : [];
  const strengths = Array.isArray(m.strengths) ? m.strengths : [];
  const score = typeof m.score === "number" ? `${m.score}/100` : "unscored";
  return {
    kind: "mockInterview",
    id: m.id,
    title: `${m.role || "Mock interview"}${m.industry ? ` · ${m.industry}` : ""}`,
    summary: `Score ${score} — ${strengths.length} strengths, ${improvements.length} areas to improve`,
    detail: improvements.length ? `Areas to improve: ${improvements.join("; ")}` : (m.feedback || ""),
    tags: [m.role, m.industry].filter(Boolean),
    importance: 0.85,
    type: "mockInterview",
    content: `${m.role || ""} ${m.industry || ""} ${improvements.join(" ")} ${m.feedback || ""}`,
    updatedAt: m.createdAt,
    payload: { score: m.score, improvements, strengths, feedback: m.feedback, role: m.role },
  };
}

function normAssessment(a) {
  const score = typeof a.quizScore === "number" ? `${Math.round(a.quizScore)}%` : "—";
  return {
    kind: "assessment",
    id: a.id,
    title: `${a.category || "Quiz"} assessment — ${score}`,
    summary: a.improvementTip || `Scored ${score}`,
    detail: a.improvementTip || "",
    tags: [a.category].filter(Boolean),
    importance: 0.7,
    type: "assessment",
    content: `${a.category || ""} ${a.improvementTip || ""}`,
    updatedAt: a.createdAt,
    payload: { quizScore: a.quizScore, improvementTip: a.improvementTip, category: a.category },
  };
}

function normResume(r) {
  const snippet = (r.content || "").slice(0, 600);
  return {
    kind: "resume",
    id: r.id,
    title: "Current resume",
    summary: typeof r.atsScore === "number" ? `ATS ${r.atsScore}/100` : "Resume on file",
    detail: snippet,
    tags: [],
    importance: 0.85,
    type: "resume",
    content: r.content || "",
    updatedAt: r.updatedAt,
    payload: { atsScore: r.atsScore },
  };
}

function normLearningTopic(t) {
  const prof = typeof t.proficiency === "number" ? `${Math.round(t.proficiency * 100)}%` : "—";
  return {
    kind: "learningTopic",
    id: t.id,
    title: t.skill,
    summary: `Status: ${t.status}, proficiency ${prof}`,
    detail: t.notes || "",
    tags: [t.skill].filter(Boolean),
    importance: 0.7,
    type: "learningTopic",
    content: `${t.skill} ${t.status} ${t.notes || ""}`,
    updatedAt: t.lastTouchedAt || t.updatedAt,
    payload: { status: t.status, proficiency: t.proficiency, skill: t.skill },
  };
}

function normCareerGoal(g) {
  return {
    kind: "careerGoal",
    id: g.id,
    title: g.targetRole,
    summary: [g.targetLevel, g.timeframe].filter(Boolean).join(" · ") || "Active career goal",
    detail: g.rationale || "",
    tags: [g.targetRole].filter(Boolean),
    importance: 0.6,
    type: "careerGoal",
    content: `${g.targetRole} ${g.targetLevel || ""} ${g.rationale || ""}`,
    updatedAt: g.updatedAt,
    payload: { targetRole: g.targetRole, targetLevel: g.targetLevel, timeframe: g.timeframe },
  };
}

function normApplication(a) {
  return {
    kind: "application",
    id: a.id,
    title: `${a.role} @ ${a.company}`,
    summary: a.status,
    detail: a.notes || "",
    tags: [a.company, a.role].filter(Boolean),
    importance: 0.7,
    type: "application",
    content: `${a.company} ${a.role} ${a.status} ${a.notes || ""}`,
    updatedAt: a.appliedAt || a.updatedAt,
    payload: { status: a.status, company: a.company, role: a.role },
  };
}

function normGithubRepo(g) {
  return {
    kind: "githubRepo",
    id: g.id,
    title: g.fullName,
    summary: g.language ? `${g.language} · ${g.analysisStatus}` : g.analysisStatus,
    detail: "",
    tags: [g.language].filter(Boolean),
    importance: 0.6,
    type: "githubRepo",
    content: `${g.fullName} ${g.language || ""}`,
    updatedAt: g.updatedAt,
    payload: { fullName: g.fullName, language: g.language, analysisStatus: g.analysisStatus },
  };
}

export function scoreItem(item, queryTokens, typeWeights) {
  return scoreMemory({
    memory: {
      content: item.content,
      tags: item.tags || [],
      type: item.type,
      importance: item.importance ?? 0.5,
      updatedAt: item.updatedAt,
    },
    queryTokens,
    typeWeights,
  });
}