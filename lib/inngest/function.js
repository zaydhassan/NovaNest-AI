import { db } from "@/lib/prisma";
import { inngest } from "./client";
import { generateJSON } from "@/lib/ai/gemini";
import { industryInsightsPrompt, weeklyDigestPrompt } from "@/lib/ai/prompts";

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
      });
    }
  }
);