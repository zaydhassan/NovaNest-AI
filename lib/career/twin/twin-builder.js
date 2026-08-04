import { db } from "@/lib/prisma";
import { generateJSON } from "@/lib/ai/gemini";
import { buildPrompt } from "@/lib/career/prompts/prompt-service";
import { buildUserProfile } from "@/lib/career/ui/chat-context";

const MEMORY_TYPES = [
  "identity",
  "career",
  "interview",
  "application",
  "learning",
  "project",
  "github",
  "preference",
  "skill",
  "achievement",
];

export async function gatherTwinSources(userId, client = db) {
  const [user, resume, repos, mocks, applications, memories] = await Promise.all([
    client.user.findUnique({
      where: { id: userId },
      select: { id: true, industry: true, experience: true, skills: true, bio: true, preferredName: true },
    }),
    client.resume.findUnique({
      where: { userId },
      select: { content: true, atsScore: true },
    }),
    client.gitHubRepo.findMany({
      where: { userId, analysisStatus: "complete" },
      select: { fullName: true, language: true, analysis: true },
      take: 6,
    }),
    client.mockInterview.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { role: true, score: true, strengths: true, improvements: true, createdAt: true },
    }),
    client.application.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: { company: true, role: true, status: true },
    }),
    client.memoryEntry.findMany({
      where: { userId, isForgotten: false },
      select: { type: true, content: true, tags: true, importance: true, createdAt: true },
    }),
  ]);

  const grouped = {};
  for (const m of memories) {
    const t = MEMORY_TYPES.includes(m.type) ? m.type : "preference";
    (grouped[t] ||= []).push({
      content: m.content,
      tags: m.tags,
      importance: m.importance,
      createdAt: m.createdAt,
    });
  }
  for (const t of Object.keys(grouped)) grouped[t] = grouped[t].slice(0, 30);

  const profile = buildUserProfile(user ?? {}, {});

  return {
    profile,
    memories: grouped,
    resume: resume?.content ?? null,
    github: repos.map((r) => ({
      repo: r.fullName,
      language: r.language,
      grade: r.analysis?.grade ?? null,
      highlights: r.analysis?.highlights ?? [],
    })),
    mocks: mocks.map((m) => ({
      role: m.role,
      score: m.score,
      strengths: m.strengths,
      improvements: m.improvements,
    })),
    applications: applications.map((a) => ({
      company: a.company,
      role: a.role,
      status: a.status,
    })),
  };
}

export async function buildTwinProfile(sources) {
  try {
    const prompt = buildPrompt("twinBuild", sources);
    const parsed = await generateJSON(prompt);
    const twin = normalizeTwin(parsed);
    return { twin, error: null };
  } catch (error) {
    console.error("[NovaNest] twin build failed:", error?.message);
    return { twin: null, error: error?.message ?? "Twin build failed." };
  }
}

function normalizeTwin(raw = {}) {
  const str = (v) => (typeof v === "string" ? v : "");
  const arr = (v) => (Array.isArray(v) ? v.map(String).filter(Boolean) : []);
  return {
    communicationStyle: str(raw.communicationStyle),
    codingStyle: str(raw.codingStyle),
    projects: arr(raw.projects).map((p) =>
      typeof p === "object" && p ? {
        name: String(p.name ?? ""),
        summary: String(p.summary ?? ""),
        technologies: Array.isArray(p.technologies) ? p.technologies.map(String) : [],
        impact: String(p.impact ?? ""),
      } : { name: String(p), summary: "", technologies: [], impact: "" }
    ),
    github: arr(raw.github).map((g) =>
      typeof g === "object" && g ? {
        repo: String(g.repo ?? ""),
        language: String(g.language ?? ""),
        grade: String(g.grade ?? ""),
        highlights: Array.isArray(g.highlights) ? g.highlights.map(String) : [],
      } : { repo: String(g), language: "", grade: "", highlights: [] }
    ),
    resume: raw.resume && typeof raw.resume === "object" ? {
      topSkills: arr(raw.resume.topSkills),
      experienceYears:
        Number.isFinite(Number(raw.resume.experienceYears)) ? Number(raw.resume.experienceYears) : null,
      headline: str(raw.resume.headline),
    } : { topSkills: [], experienceYears: null, headline: "" },
    strengths: arr(raw.strengths),
    weaknesses: arr(raw.weaknesses),
    ambitions: arr(raw.ambitions),
    skillSnapshot: raw.skillSnapshot && typeof raw.skillSnapshot === "object" ? {
      strong: arr(raw.skillSnapshot.strong),
      developing: arr(raw.skillSnapshot.developing),
      gaps: arr(raw.skillSnapshot.gaps),
    } : { strong: [], developing: [], gaps: [] },
    summary: str(raw.summary),
  };
}