/**
 * Timeline derivers — pure functions that turn existing data rows into
 * TimelineEvent specs ({ type, title, description?, occurredAt, metadata?,
 * sourceType, sourceId }). No DB writes here; `TimelineEngine.backfill`
 * queries the rows and feeds them through these.
 *
 * `sourceType` matches the originating data (resume|application|mockInterview|
 * assessment|chat|github|learning|memory|manual) so events are idempotent on
 * (userId, sourceType, sourceId).
 */

/**
 * @typedef {Object} TimelineEventSpec
 * @property {string} type        - one of TIMELINE_TYPES
 * @property {string} title
 * @property {string} [description]
 * @property {Date|string} occurredAt
 * @property {object} [metadata]
 * @property {string} sourceType
 * @property {string} sourceId
 */

/** @param {Date|string|number} d */
function toIso(d) {
  if (!d) return new Date().toISOString();
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? new Date().toISOString() : dt.toISOString();
}

/** A resume save/refresh → a "building" milestone. */
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

/** An application row → "applying" (or "interviewing"/"offer"/"rejection"). */
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

/** A mock interview → "interviewing" (practice). */
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

/** A quiz assessment → "learning". */
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

/** A completed cover letter → "applying" (prep artifact). */
export function deriveFromCoverLetter(letter) {
  if (!letter) return null;
  return {
    type: "applying",
    title: `Cover letter for ${letter.companyName}`,
    description: letter.jobTitle ? `Role: ${letter.jobTitle}` : null,
    occurredAt: toIso(letter.createdAt),
    metadata: { company: letter.companyName, jobTitle: letter.jobTitle },
    sourceType: "resume", // grouped with resume-prep artifacts; distinct sourceId keeps it unique
    sourceId: letter.id,
  };
}

/** A connected + analyzed GitHub repo → a "building"/"github" milestone. */
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

/**
 * A learning session → a "learning" milestone. Sessions are idempotent on their
 * own id (sourceType "learning"), and an associated topic (when present) is
 * noted in the description but the event is keyed to the session, not the
 * topic, so a topic can accumulate many practice events over time.
 *
 * @param {{ id: string, kind: string, summary?: string|null, durationMin?: number|null, topic?: { skill: string }|null }} session
 * @returns {TimelineEventSpec|null}
 */
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

/**
 * Derive all TimelineEvent specs for a user from their existing data.
 * Read-only; called by `TimelineEngine.backfill` and the one-off backfill
 * script. The caller is responsible for idempotent inserts.
 *
 * @param {string} userId
 * @param {any} client - prisma tx or db
 * @returns {Promise<TimelineEventSpec[]>}
 */
export async function deriveAllForUser(userId, client) {
  const [resume, applications, mocks, assessments, coverLetters, repos, sessions] =
    await Promise.all([
      client.resume.findUnique({ where: { userId } }),
      client.application.findMany({ where: { userId } }),
      client.mockInterview.findMany({ where: { userId } }),
      client.assessment.findMany({ where: { userId } }),
      client.coverLetter.findMany({ where: { userId } }),
      client.githubRepo.findMany({ where: { userId } }),
      client.learningSession.findMany({
        where: { userId },
        include: { topic: { select: { skill: true } } },
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
  return specs.filter(Boolean);
}