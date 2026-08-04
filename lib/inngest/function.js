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
  const day = d.getUTCDay();
  d.setUTCDate(d.getUTCDate() - day);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export const generateIndustryInsights = inngest.createFunction(
  { id: "generate-industry-insights", name: "Generate Industry Insights" },
  { cron: "0 0 * * 0" },
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

export const generateCompanyProfiles = inngest.createFunction(
  { id: "generate-company-profiles", name: "Generate Company Profiles" },
  { cron: "0 1 * * 0" },
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

export const generateWeeklyDigests = inngest.createFunction(
  { id: "generate-weekly-digests", name: "Generate Weekly Digests" },
  { cron: "0 6 * * 1" },
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
        const existing = await db.weeklyDigest.findUnique({
          where: { userId_weekStart: { userId: user.id, weekStart } },
          select: { id: true },
        });
        if (existing) return;

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
          return;
        }

        await db.weeklyDigest.create({
          data: { userId: user.id, weekStart, content },
        });

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

export const backfillCareerTimeline = inngest.createFunction(
  { id: "backfill-career-timeline", name: "Backfill Career OS Timeline" },
  { event: "timeline/backfill.requested" },
  async ({ event, step }) => {
    const userId = event?.data?.userId;
    if (!userId) return { skipped: "no userId" };

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

export const analyzeGitHubRepo = inngest.createFunction(
  { id: "analyze-github-repo", name: "Analyze GitHub Repository" },
  { event: "github/repo.connected" },
  async ({ event, step }) => {
    const { repoId, userId, fullName, pat } = event?.data ?? {};
    if (!repoId || !userId || !fullName) return { skipped: "missing event data" };

    const payload = await step.run("Fetch repo payload", async () => {
      return fetchRepoPayload({ fullName, pat: pat ?? null });
    });

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

    const sources = await step.run("Gather twin sources", async () => {
      return gatherTwinSources(userId);
    });

    const built = await step.run("Build twin profile", async () => {
      return buildTwinProfile(sources);
    });

    if (!built.twin) {
      return { userId, failed: built.error };
    }

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

export const weeklyCoachDigest = inngest.createFunction(
  { id: "weekly-coach-digest", name: "Weekly Coach Digest" },
  { cron: "30 6 * * 1" },
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
          return;
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