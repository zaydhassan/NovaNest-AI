import { db } from "@/lib/prisma";
import { inngest } from "./client";
import { generateJSON } from "@/lib/ai/gemini";
import { industryInsightsPrompt, weeklyDigestPrompt, companyProfilePrompt } from "@/lib/ai/prompts";
import { DREAM_COMPANIES } from "@/lib/constants";
import { createNotification } from "@/lib/notifications";
import { backfillTimeline } from "@/lib/career/timeline/timeline-engine";
import { backfillMockInterviews } from "@/lib/career/memory/interview-memory";
import { fetchRepoPayload } from "@/lib/career/github/github-fetcher";
import { githubAgent } from "@/lib/career/agents/github.agent";
import { fromGitHub } from "@/lib/career/memory/memory-extractors";
import { recordTimelineEvent } from "@/lib/career/timeline/timeline-engine";
import { deriveFromGitHub } from "@/lib/career/timeline/timeline-derivers";
import { gatherTwinSources, buildTwinProfile } from "@/lib/career/twin/twin-builder";
import { buildPrompt } from "@/lib/career/prompts/prompt-service";
import { buildUserProfile, summarizeMemory } from "@/lib/career/ui/chat-context";
import { recallMemory } from "@/lib/career/memory/memory-service";
import { scoreResumeAgainstTarget } from "@/lib/career/resume/score-service";
import { reextractFromSource } from "@/lib/career/memory/extract-dispatcher";

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getUTCDay(); // 0 = Sunday
  d.setUTCDate(d.getUTCDate() - day);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Weekly cron: refresh insights for every known industry.
 * Uses the shared Gemini client + robust JSON parser so a fenced/malformed
 * model response no longer aborts the whole cron run.
 */
export const generateIndustryInsights = inngest.createFunction(
  { id: "generate-industry-insights", name: "Generate Industry Insights" },
  { cron: "0 0 * * 0" }, // Every Sunday at midnight (UTC)
  async ({ step }) => {
    const industries = await step.run("Fetch industries", async () => {
      return await db.industryInsight.findMany({
        select: { industry: true },
      });
    });

    for (const { industry } of industries) {
      const insights = await step.run(`Generate insights for ${industry}`, async () => {
        return await generateJSON(industryInsightsPrompt(industry));
      });

      await step.run(`Update ${industry} insights`, async () => {
        await db.industryInsight.update({
          where: { industry },
          data: {
            ...insights,
            lastUpdated: new Date(),
            nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        });
      });
    }
  }
);

/**
 * Weekly cron: refresh the CompanyProfile for every dream company. Mirrors
 * `generateIndustryInsights` but is company-scoped. Staggered to Sundays 01:00
 * UTC — one hour after the industry-insights cron (00:00) so the two passes
 * don't spike together. The on-demand `getOrGenerateCompanyProfile` bootstraps
 * a missing profile; this keeps them fresh.
 */
export const generateCompanyProfiles = inngest.createFunction(
  { id: "generate-company-profiles", name: "Generate Company Profiles" },
  { cron: "0 1 * * 0" }, // Every Sunday at 01:00 UTC
  async ({ step }) => {
    for (const { slug, name } of DREAM_COMPANIES) {
      const profile = await step.run(`Generate profile for ${slug}`, async () => {
        return await generateJSON(companyProfilePrompt(slug, name));
      });

      await step.run(`Upsert ${slug} profile`, async () => {
        await db.companyProfile.upsert({
          where: { company: slug },
          update: {
            ...profile,
            displayName: name,
            lastUpdated: new Date(),
            nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
          create: {
            company: slug,
            displayName: name,
            ...profile,
            nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        });
      });
    }
  }
);

/**
 * Weekly cron: generate a personalized career digest for every onboarded user
 * and persist it as the week's WeeklyDigest row. Runs Monday morning so the
 * brief is fresh at the start of the user's week.
 */
export const generateWeeklyDigests = inngest.createFunction(
  { id: "generate-weekly-digests", name: "Generate Weekly Digests" },
  { cron: "0 6 * * 1" }, // Every Monday at 06:00 UTC
  async ({ step }) => {
    const users = await step.run("Fetch onboarded users", async () => {
      return db.user.findMany({
        where: { NOT: { industry: null } },
        select: { id: true, industry: true, experience: true, skills: true, bio: true },
      });
    });

    const weekStart = startOfWeek(new Date());

    for (const user of users) {
      await step.run(`Digest for ${user.id}`, async () => {
        // Skip if this week's digest already exists (idempotent).
        const existing = await db.weeklyDigest.findUnique({
          where: { userId_weekStart: { userId: user.id, weekStart } },
          select: { id: true },
        });
        if (existing) return;

        // Pull the user's industry insight + last week's activity summary.
        const [insights, assessments, applications, resumes] = await Promise.all([
          db.industryInsight.findUnique({
            where: { industry: user.industry },
            select: {
              marketOutlook: true,
              demandLevel: true,
              keyTrends: true,
              recommendedSkills: true,
            },
          }),
          db.assessment.count({ where: { userId: user.id } }),
          db.application.count({ where: { userId: user.id } }),
          db.resume.findUnique({
            where: { userId: user.id },
            select: { id: true },
          }),
        ]);

        const recentActivity = [
          `${assessments} practice quizzes completed`,
          `${applications} applications tracked`,
          resumes ? "has a saved resume" : "no resume saved yet",
        ].join("; ");

        let content;
        try {
          content = await generateJSON(
            weeklyDigestPrompt(
              { industry: user.industry, experience: user.experience },
              insights,
              recentActivity
            )
          );
        } catch (error) {
          console.error(`[NovaNest] digest gen failed for ${user.id}:`, error?.message);
          return; // best-effort; one user's failure shouldn't abort the cron
        }

        await db.weeklyDigest.create({
          data: { userId: user.id, weekStart, content },
        });

        // Notify the user their weekly brief is ready (best-effort).
        createNotification(user.id, {
          type: "weekly_digest",
          title: "Your Monday brief is ready 📬",
          body: content?.headline
            ? String(content.headline).slice(0, 140)
            : "Market pulse, a skill to watch, and this week's action item.",
          href: "/dashboard",
          data: { weekStart },
        }).catch((e) =>
          console.error(`[NovaNest] weekly_digest notify ${user.id}:`, e?.message)
        );
      });
    }
  }
);

/**
 * Event-triggered: backfill one user's Career OS timeline + denormalized
 * MockInterview fields from their existing data. Idempotent (dedupes per
 * source per type), so it's safe to fire repeatedly — e.g. on first sign-in
 * after the Career OS rollout, or from the one-off backfill script.
 *
 * Triggered by `timeline/backfill.requested` with `{ userId }` in the event data.
 * If no userId is supplied, the job no-ops (a bulk backfill is a one-off script,
 * not a recurring cron, so we keep this per-user).
 */
export const backfillCareerTimeline = inngest.createFunction(
  { id: "backfill-career-timeline", name: "Backfill Career OS Timeline" },
  { event: "timeline/backfill.requested" },
  async ({ event, step }) => {
    const userId = event?.data?.userId;
    if (!userId) return { skipped: "no userId" };

    // Validate the user exists + is owned (defense against stale events).
    const user = await step.run("Verify user", async () => {
      return db.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });
    });
    if (!user) return { skipped: "user not found" };

    const timelineResult = await step.run("Backfill timeline events", async () => {
      return backfillTimeline(userId);
    });

    const mockResult = await step.run("Backfill mock denorm fields", async () => {
      return backfillMockInterviews(userId);
    });

    return { timeline: timelineResult, mock: mockResult };
  }
);

/**
 * Event-triggered (M7): analyze a connected GitHub repo as a senior staff
 * engineer. Triggered by `github/repo.connected` with `{ repoId, userId,
 * fullName, pat }` in the event data.
 *
 * The PAT (when supplied) is used ONLY inside this job to fetch the repo tree +
 * key files, then discarded — it is never persisted (only its sha256 lives on
 * GitHubRepo.patHash, written by the connect action). Public repos arrive with
 * `pat: null` and fetch unauthenticated.
 *
 * Steps: fetch payload → mark running → senior review → persist analysis +
 * memory + timeline + notification. A fetch or model failure marks the repo
 * `failed` with the error message so the UI can show it.
 */
export const analyzeGitHubRepo = inngest.createFunction(
  { id: "analyze-github-repo", name: "Analyze GitHub Repository" },
  { event: "github/repo.connected" },
  async ({ event, step }) => {
    const { repoId, userId, fullName, pat } = event?.data ?? {};
    if (!repoId || !userId || !fullName) return { skipped: "missing event data" };

    // 1. Fetch the repo payload (metadata + tree + README + sampled files).
    //    The PAT is used here and then dropped (it leaves no scope after this).
    const payload = await step.run("Fetch repo payload", async () => {
      return fetchRepoPayload({ fullName, pat: pat ?? null });
    });

    // 2. Persist metadata + mark running.
    await step.run("Persist metadata", async () => {
      return db.gitHubRepo.update({
        where: { id: repoId },
        data: {
          description: payload.description,
          language: payload.language,
          defaultBranch: payload.defaultBranch,
          stars: payload.stars,
          isPrivate: payload.isPrivate,
          analysisStatus: "running",
          analysisError: null,
        },
      });
    });

    // 3. Senior-engineer review (Gemini). The agent never throws — it returns
    //    `{ review, error }` so we can persist a clean failed state.
    const result = await step.run("Senior-engineer review", async () => {
      return githubAgent.run({ ctx: payload });
    });

    if (!result?.review) {
      await step.run("Mark failed", async () => {
        return db.gitHubRepo.update({
          where: { id: repoId },
          data: { analysisStatus: "failed", analysisError: result?.error || "Analysis failed." },
        });
      });
      return { repoId, failed: result?.error };
    }

    // 4. Persist the completed analysis.
    const repo = await step.run("Persist analysis", async () => {
      return db.gitHubRepo.update({
        where: { id: repoId },
        data: {
          analysis: result.review,
          analysisStatus: "complete",
          analysisError: null,
          lastSyncedAt: new Date(),
        },
      });
    });

    // 5. Best-effort memory + timeline + notification. Each in its own step so
    //    a failure in one doesn't roll back the persisted analysis.
    await step.run("Memory + timeline + notify", async () => {
      await Promise.all([
        fromGitHub(userId, repo).catch((e) =>
          console.error("[NovaNest] fromGitHub:", e?.message)
        ),
        recordTimelineEvent({ userId, ...deriveFromGitHub(repo) }).catch((e) =>
          console.error("[NovaNest] timeline github:", e?.message)
        ),
        createNotification(userId, {
          type: "github_analyzed",
          title: `${fullName} analyzed`,
          body: result.review?.grade
            ? `Senior-engineer review ready — grade ${result.review.grade}.`
            : "Senior-engineer review ready.",
          href: "/github",
          data: { fullName, grade: result.review?.grade ?? null },
        }).catch((e) => console.error("[NovaNest] github_analyzed notify:", e?.message)),
      ]);
    });

    return { repoId, grade: result.review?.grade };
  }
);

/**
 * Event-triggered (M8): rebuild the user's AI Career Twin from everything
 * NovaNest remembers. Triggered by `twin/rebuild.requested` with `{ userId }`.
 * Gathers memory + resume + GitHub + mocks + applications, runs the
 * `twinBuild` prompt, upserts CareerTwin, bumps User.twinVersion, and notifies.
 */
export const rebuildCareerTwin = inngest.createFunction(
  { id: "rebuild-career-twin", name: "Rebuild Career Twin" },
  { event: "twin/rebuild.requested" },
  async ({ event, step }) => {
    const userId = event?.data?.userId;
    if (!userId) return { skipped: "no userId" };

    const user = await step.run("Verify user", async () => {
      return db.user.findUnique({ where: { id: userId }, select: { id: true, twinVersion: true } });
    });
    if (!user) return { skipped: "user not found" };

    // 1. Gather twin sources (read-only parallel queries).
    const sources = await step.run("Gather twin sources", async () => {
      return gatherTwinSources(userId);
    });

    // 2. Build the profile via Gemini (never throws — returns { twin, error }).
    const built = await step.run("Build twin profile", async () => {
      return buildTwinProfile(sources);
    });

    if (!built.twin) {
      return { userId, failed: built.error };
    }

    // 3. Upsert the twin + bump version.
    const nextVersion = (user.twinVersion ?? 0) + 1;
    const twin = await step.run("Persist twin", async () => {
      return db.careerTwin.upsert({
        where: { userId },
        update: { profile: built.twin, version: nextVersion, lastUpdatedAt: new Date() },
        create: { userId, profile: built.twin, version: 1 },
      });
    });
    await step.run("Bump twin version", async () => {
      return db.user.update({
        where: { id: userId },
        data: { twinVersion: nextVersion },
      });
    });

    // 4. Best-effort notification.
    await step.run("Notify twin ready", async () => {
      return createNotification(userId, {
        type: "twin_ready",
        title: "Your Career Twin is ready",
        body: "Your AI career twin has been rebuilt from your latest history.",
        href: "/twin",
        data: { version: nextVersion },
      }).catch((e) => console.error("[NovaNest] twin_ready notify:", e?.message));
    });

    return { userId, version: nextVersion, twinId: twin.id };
  }
);

/**
 * Weekly cron (M10): generate 3-5 proactive CoachInsights for every onboarded
 * user from their past-week activity + memory + active goal, and notify. Runs
 * Monday 06:30 UTC — staggered 30 min after the existing `generate-weekly-digests`
 * cron (06:00) so the two Monday passes don't spike together.
 *
 * Idempotent-ish: insights are timestamped rows (not deduped) since each week's
 * digest is a fresh read of activity. The Coach surface shows newest-first.
 */
export const weeklyCoachDigest = inngest.createFunction(
  { id: "weekly-coach-digest", name: "Weekly Coach Digest" },
  { cron: "30 6 * * 1" }, // Mondays at 06:30 UTC
  async ({ step }) => {
    const users = await step.run("Fetch onboarded users", async () => {
      return db.user.findMany({
        where: { NOT: { industry: null } },
        select: {
          id: true,
          industry: true,
          experience: true,
          skills: true,
          bio: true,
          streak: true,
          lastActiveAt: true,
        },
      });
    });

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    for (const user of users) {
      await step.run(`Coach digest for ${user.id}`, async () => {
        // Past-week activity counts + active goal + memory, in parallel.
        const [mocks, applications, coverLetters, assessments, learning, goal, memory] =
          await Promise.all([
            db.mockInterview.findMany({
              where: { userId: user.id, createdAt: { gte: weekAgo } },
              select: { id: true, role: true, score: true },
              orderBy: { createdAt: "desc" },
              take: 5,
            }),
            db.application.findMany({
              where: { userId: user.id, updatedAt: { gte: weekAgo } },
              select: { id: true, company: true, role: true, status: true },
              orderBy: { updatedAt: "desc" },
              take: 8,
            }),
            db.coverLetter.count({
              where: { userId: user.id, createdAt: { gte: weekAgo } },
            }),
            db.assessment.count({
              where: { userId: user.id, createdAt: { gte: weekAgo } },
            }),
            db.learningSession.count({
              where: { userId: user.id, createdAt: { gte: weekAgo } },
            }),
            db.careerGoal.findFirst({
              where: { userId: user.id, status: "active" },
              orderBy: { updatedAt: "desc" },
              select: { targetRole: true, targetLevel: true, timeframe: true },
            }),
            recallMemory({
              userId: user.id,
              query: "career goals weaknesses recent progress applications interviews skills",
              limit: 8,
            }).catch(() => []),
          ]);

        const weeklyActivity = [
          `${assessments} quiz(zes)`,
          `${mocks.length} mock interview(s)${mocks[0] ? ` (last: ${mocks[0].role} ${mocks[0].score ?? "-"}/100)` : ""}`,
          `${applications.length} application update(s)${applications[0] ? ` (latest: ${applications[0].company} [${applications[0].status}])` : ""}`,
          `${coverLetters} cover letter(s)`,
          `${learning} learning session(s)`,
          `${user.streak || 0}-day streak`,
        ].join("; ");

        const goalText = goal
          ? `${goal.targetRole}${goal.targetLevel ? ` (${goal.targetLevel})` : ""}${goal.timeframe ? ` within ${goal.timeframe}` : ""}`
          : "(no active goal set)";

        let insights = [];
        try {
          const parsed = await generateJSON(
            buildPrompt("coachDigest", {
              profile: buildUserProfile(user),
              weeklyActivity,
              memorySummary: summarizeMemory(memory),
              goal: goalText,
            })
          );
          insights = Array.isArray(parsed?.insights) ? parsed.insights : [];
        } catch (e) {
          console.error(`[NovaNest] weeklyCoachDigest gen failed for ${user.id}:`, e?.message);
          return; // best-effort; one user's failure shouldn't abort the cron
        }

        const created = [];
        for (const ins of insights.slice(0, 5)) {
          if (!ins?.title) continue;
          const row = await db.coachInsight.create({
            data: {
              userId: user.id,
              kind: String(ins.kind ?? "nudge"),
              title: String(ins.title).slice(0, 200),
              body: ins.body ? String(ins.body).slice(0, 600) : null,
              severity: String(ins.severity ?? "info"),
              href: ins.href ? String(ins.href) : null,
              data: { source: "weekly_digest" },
            },
          });
          created.push(row);
          createNotification(user.id, {
            type: "coach_insight",
            title: row.title,
            body: row.body ?? undefined,
            href: row.href ?? "/coach",
            data: { insightId: row.id, kind: row.kind, source: "weekly_digest" },
          }).catch((e) => console.error(`[NovaNest] weekly digest notify ${user.id}:`, e?.message));
        }
        return { count: created.length };
      });
    }
  }
);

/**
 * Event-triggered (M10): score a saved resume against the user's industry when
 * no job description is in play. Triggered by `resume/saved` with
 * `{ userId, resumeId }`. Complements the on-demand `scoreResume` action (which
 * scores against a supplied JD) — this is the background "always score against
 * my industry" pass that keeps the resume's atsScore fresh on every save.
 *
 * Best-effort: a Gemini failure just leaves the prior score in place.
 */
export const scoreResumeAgainstIndustry = inngest.createFunction(
  { id: "score-resume-against-industry", name: "Score Resume Against Industry" },
  { event: "resume/saved" },
  async ({ event, step }) => {
    const { userId, resumeId } = event?.data ?? {};
    if (!userId) return { skipped: "no userId" };

    const user = await step.run("Verify user", async () => {
      return db.user.findUnique({ where: { id: userId }, select: { id: true } });
    });
    if (!user) return { skipped: "user not found" };

    const result = await step.run("Score resume against industry", async () => {
      return scoreResumeAgainstTarget(userId, { resumeId });
    });

    return { userId, resumeId, scored: Boolean(result) };
  }
);

/**
 * Event-triggered (M10): a deeper/refresh memory re-extraction for a source
 * row. Triggered by `memory/source.created` with `{ userId, source, sourceId }`.
 * Re-runs the source-appropriate extractor headlessly; idempotent (dedupes on
 * userId+source+sourceId+content), so it's safe to fire after every action or
 * on a manual trigger. The chat source re-runs the AI-driven fromChat.
 */
export const extractMemoriesFromSource = inngest.createFunction(
  { id: "extract-memories-from-source", name: "Extract Memories From Source" },
  { event: "memory/source.created" },
  async ({ event, step }) => {
    const { userId, source, sourceId } = event?.data ?? {};
    if (!userId || !source) return { skipped: "missing event data" };

    const created = await step.run("Re-extract memories", async () => {
      return reextractFromSource({ userId, source, sourceId: sourceId ?? null });
    });

    return { userId, source, sourceId: sourceId ?? null, created: created?.length ?? 0 };
  }
);