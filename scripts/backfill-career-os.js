/**
 * One-off backfill: populate Career OS (Timeline + Memory + denormalized
 * MockInterview fields) from each user's *existing* data.
 *
 * Idempotent:
 *  - TimelineEngine.backfill dedupes on (userId, sourceType, sourceId, type).
 *  - MemoryService.extractAndWrite dedupes on (userId, source, sourceId, content).
 *  - backfillMockInterviews only updates rows whose denormalized fields are empty.
 *
 * Safe to re-run; safe to interrupt (writes commit per-row as we go).
 *
 * Run:  node --env-file=.env scripts/backfill-career-os.js
 *   (or) npx dotenv -e .env -- node scripts/backfill-career-os.js
 *
 * NOTE: this is a standalone Node script, not a Next.js route, so the `@/`
 * path alias is not wired up by the framework. We register a tiny ESM
 * resolve hook that maps `@/...` → `<projectRoot>/...` and then dynamic-import
 * the modules (static imports are hoisted + resolved before the hook runs).
 */

// --- bootstrap the @/ path alias -------------------------------------------
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const rootUrl = pathToFileURL(projectRoot + "/").href;

register(
  `data:text/javascript,${encodeURIComponent(`
    export function resolve(specifier, context, nextResolve) {
      if (specifier.startsWith('@/')) {
        return nextResolve(${JSON.stringify(rootUrl)} + specifier.slice(2), context);
      }
      return nextResolve(specifier, context);
    }
  `)}`,
  pathToFileURL(import.meta.url).href
);

// --- now dynamic-import the Career OS modules (so they resolve through @/) --
const { db } = await import("@/lib/prisma");
const { backfillTimeline } = await import("@/lib/career/timeline/timeline-engine");
const {
  fromResume,
  fromApplication,
  fromMock,
  fromQuiz,
  fromOnboarding,
} = await import("@/lib/career/memory/memory-extractors");
const {
  backfillMockInterviews,
  parseFeedback,
} = await import("@/lib/career/memory/interview-memory");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function backfillUser(user) {
  const result = {
    timeline: { created: 0, skipped: 0 },
    mock: { updated: 0, skipped: 0 },
    memories: 0,
  };
  const errors = [];

  // 1) Timeline — derived from resumes, applications, mocks, assessments, cover letters.
  try {
    result.timeline = await backfillTimeline(user.id);
  } catch (e) {
    errors.push(["timeline", e?.message]);
  }

  // 2) Denormalized MockInterview columns from the JSON-stringified feedback.
  try {
    result.mock = await backfillMockInterviews(user.id);
  } catch (e) {
    errors.push(["mock-denorm", e?.message]);
  }

  // 3) Memories — re-extract from existing rows. Each extractor is best-effort.
  const count = (n) => {
    result.memories += Array.isArray(n) ? n.length : 0;
  };
  const safe = async (label, fn) => {
    try {
      await fn().then(count);
    } catch (e) {
      errors.push([label, e?.message]);
    }
  };

  // Resumes → identity + skill memories.
  await safe("resume", async () => {
    const resumes = await db.resume.findMany({
      where: { userId: user.id },
      select: { id: true, content: true, atsScore: true },
    });
    for (const r of resumes) await fromResume(user.id, r);
  });

  // Applications → one application memory each.
  await safe("application", async () => {
    const apps = await db.application.findMany({
      where: { userId: user.id },
      select: { id: true, company: true, role: true, status: true },
    });
    for (const a of apps) await fromApplication(user.id, a);
  });

  // Mocks → interview memory + skill-gap memories (uses the feedback we just
  // denormalized, falling back to the parsed feedback JSON).
  await safe("mock", async () => {
    const mocks = await db.mockInterview.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        role: true,
        feedback: true,
        strengths: true,
        improvements: true,
        score: true,
      },
    });
    for (const m of mocks) {
      const f = parseFeedback(m);
      await fromMock(user.id, { id: m.id, role: m.role }, f);
    }
  });

  // Assessments → learning memory each.
  await safe("quiz", async () => {
    const assessments = await db.assessment.findMany({
      where: { userId: user.id },
      select: { id: true, category: true, quizScore: true, improvementTip: true },
    });
    for (const a of assessments) await fromQuiz(user.id, a);
  });

  // Onboarding → identity + skill memories from the user profile (best-effort:
  // older users may have skipped onboarding, in which case fields are blank).
  await safe("onboarding", async () => {
    if (user.industry || user.skills?.length || user.bio) {
      await fromOnboarding(user.id, {
        industry: user.industry,
        experience: user.experience,
        skills: user.skills,
        bio: user.bio,
      });
    }
  });

  for (const [label, msg] of errors) {
    console.error(`  [${user.id}] ${label} failed:`, msg);
  }

  return result;
}

async function main() {
  const users = await db.user.findMany({
    select: { id: true, industry: true, experience: true, skills: true, bio: true },
  });
  console.log(`Career OS backfill — ${users.length} user(s).`);

  let totalEvents = 0;
  let totalMemories = 0;
  let totalMockUpdates = 0;
  for (const user of users) {
    const r = await backfillUser(user);
    totalEvents += r.timeline.created;
    totalMemories += r.memories;
    totalMockUpdates += r.mock.updated;
    console.log(
      `  ${user.id}: timeline +${r.timeline.created} (skipped ${r.timeline.skipped}), ` +
        `mock denorm +${r.mock.updated} (skipped ${r.mock.skipped}), memories +${r.memories}`
    );
    // Yield between users to keep the DB happy on large installs.
    await sleep(20);
  }

  console.log(
    `\nDone. Timeline events: ${totalEvents}, memories: ${totalMemories}, ` +
      `mock denorm updates: ${totalMockUpdates}.`
  );
  await db.$disconnect();
}

main().catch(async (e) => {
  console.error("Backfill failed:", e?.stack || e?.message || e);
  await db.$disconnect();
  process.exit(1);
});