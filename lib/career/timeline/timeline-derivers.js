

function toIso(d) {
  if (!d) return new Date().toISOString();
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? new Date().toISOString() : dt.toISOString();
}

export function deriveFromResume(resume) {
  if (!resume) return null;
  return {
    type: "building",
    title: "Resume updated",
    description: "You saved or refined your resume.",
    occurredAt: toIso(resume.updatedAt ?? resume.createdAt),
    metadata: { atsScore: resume.atsScore ?? null },
    sourceType: "resume",
    sourceId: resume.id,
  };
}

export function deriveFromApplication(app) {
  if (!app) return null;
  let type = "applying";
  if (app.status === "OFFER") type = "offer";
  else if (app.status === "REJECTED") type = "rejection";
  else if (app.status === "INTERVIEW") type = "interviewing";
  return {
    type,
    title:
      type === "offer"
        ? `Offer from ${app.company}`
        : type === "rejection"
        ? `Not selected at ${app.company}`
        : type === "interviewing"
        ? `Interview at ${app.company}`
        : `Applied to ${app.company}`,
    description: app.role ? `Role: ${app.role}` : null,
    occurredAt: toIso(app.updatedAt ?? app.appliedAt ?? app.createdAt),
    metadata: { company: app.company, role: app.role, status: app.status },
    sourceType: "application",
    sourceId: app.id,
  };
}

export function deriveFromMock(mock) {
  if (!mock) return null;
  return {
    type: "interviewing",
    title: `Mock interview: ${mock.role}`,
    description:
      mock.score != null ? `Scored ${Math.round(mock.score)}%` : "Practice session",
    occurredAt: toIso(mock.createdAt),
    metadata: { role: mock.role, score: mock.score ?? null },
    sourceType: "mockInterview",
    sourceId: mock.id,
  };
}

export function deriveFromAssessment(assessment) {
  if (!assessment) return null;
  return {
    type: "learning",
    title: `Quiz: ${assessment.category}`,
    description: `Scored ${Math.round(assessment.quizScore)}%`,
    occurredAt: toIso(assessment.createdAt),
    metadata: { category: assessment.category, quizScore: assessment.quizScore },
    sourceType: "assessment",
    sourceId: assessment.id,
  };
}

export function deriveFromCoverLetter(letter) {
  if (!letter) return null;
  return {
    type: "applying",
    title: `Cover letter for ${letter.companyName}`,
    description: letter.jobTitle ? `Role: ${letter.jobTitle}` : null,
    occurredAt: toIso(letter.createdAt),
    metadata: { company: letter.companyName, jobTitle: letter.jobTitle },
    sourceType: "resume",
    sourceId: letter.id,
  };
}

export function deriveFromGitHub(repo) {
  if (!repo) return null;
  return {
    type: "github",
    title: `Analyzed repo ${repo.fullName}`,
    description:
      repo.analysis?.grade
        ? `Senior-engineer review: grade ${repo.analysis.grade}`
        : "Connected for analysis",
    occurredAt: toIso(repo.lastSyncedAt ?? repo.connectedAt ?? repo.createdAt),
    metadata: {
      fullName: repo.fullName,
      language: repo.language ?? null,
      grade: repo.analysis?.grade ?? null,
      isPrivate: repo.isPrivate,
    },
    sourceType: "github",
    sourceId: repo.id,
  };
}

export function deriveFromLearningSession(session) {
  if (!session) return null;
  const kindLabel = String(session.kind || "session").replace(/_/g, " ");
  const title = session.topic?.skill
    ? `Practiced ${session.topic.skill}`
    : `Learning session (${kindLabel})`;
  const bits = [];
  if (session.summary) bits.push(String(session.summary).slice(0, 200));
  if (session.durationMin) bits.push(`${session.durationMin} min`);
  return {
    type: "learning",
    title,
    description: bits.length ? bits.join(" · ") : null,
    occurredAt: toIso(session.occurredAt ?? session.createdAt),
    metadata: {
      kind: session.kind,
      durationMin: session.durationMin ?? null,
      skill: session.topic?.skill ?? null,
    },
    sourceType: "learning",
    sourceId: session.id,
  };
}

export function deriveFromLearningTopic(topic) {
  if (!topic) return [];
  const specs = [
    {
      type: "learning",
      title: `Started learning ${topic.skill}`,
      description: "New skill added to your learning board.",
      occurredAt: toIso(topic.createdAt),
      metadata: { skill: topic.skill },
      sourceType: "learning",
      sourceId: `${topic.id}#started`,
    },
  ];
  if (topic.status === "learned") {
    specs.push({
      type: "achievement",
      title: `Mastered ${topic.skill}`,
      description: "Skill marked as learned — Career Health learning pillar rose.",
      occurredAt: toIso(topic.updatedAt ?? topic.createdAt),
      metadata: { skill: topic.skill, status: "learned" },
      sourceType: "learning",
      sourceId: `${topic.id}#learned`,
    });
  }
  return specs;
}

export function deriveFromStructuredMemory(mem) {
  if (!mem) return null;
  if (mem.category === "certificate") {
    return {
      type: "achievement",
      title: `Certified: ${mem.title}`,
      description: mem.summary ?? null,
      occurredAt: toIso(mem.createdAt),
      metadata: { category: mem.category },
      sourceType: "memory",
      sourceId: mem.id,
    };
  }
  if (mem.category === "project") {
    return {
      type: "building",
      title: `Built: ${mem.title}`,
      description: mem.summary ?? null,
      occurredAt: toIso(mem.createdAt),
      metadata: { category: mem.category },
      sourceType: "memory",
      sourceId: mem.id,
    };
  }
  return null;
}

export async function deriveAllForUser(userId, client) {
  const [
    resume,
    applications,
    mocks,
    assessments,
    coverLetters,
    repos,
    sessions,
    topics,
    memories,
  ] = await Promise.all([
    client.resume.findUnique({ where: { userId } }),
    client.application.findMany({ where: { userId } }),
    client.mockInterview.findMany({ where: { userId } }),
    client.assessment.findMany({ where: { userId } }),
    client.coverLetter.findMany({ where: { userId } }),
    client.gitHubRepo.findMany({ where: { userId } }),
    client.learningSession.findMany({
      where: { userId },
      include: { topic: { select: { skill: true } } },
    }),
    client.learningTopic.findMany({ where: { userId } }),
    client.structuredMemory.findMany({
      where: { userId, category: { in: ["project", "certificate"] }, isArchived: false },
    }),
  ]);

  const specs = [];
  if (resume) specs.push(deriveFromResume(resume));
  for (const a of applications) specs.push(deriveFromApplication(a));
  for (const m of mocks) specs.push(deriveFromMock(m));
  for (const a of assessments) specs.push(deriveFromAssessment(a));
  for (const c of coverLetters) specs.push(deriveFromCoverLetter(c));
  for (const r of repos) specs.push(deriveFromGitHub(r));
  for (const s of sessions) specs.push(deriveFromLearningSession(s));
  for (const t of topics) specs.push(...deriveFromLearningTopic(t));
  for (const m of memories) specs.push(deriveFromStructuredMemory(m));
  return specs.filter(Boolean);
}