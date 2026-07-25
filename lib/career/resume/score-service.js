/**
 * Resume scoring service (M10) — the shared JD-build + ATS-score + persist
 * logic used by both the `scoreResume` server action (which has an auth
 * context) and the Inngest `score-resume-against-industry` job (which does
 * not — it runs headless, so it passes the userId from the event payload).
 *
 * Factored out so the scoring contract lives in one place and the Inngest job
 * doesn't need to reconstruct auth(). `tx ?? db` join pattern. Server-only.
 */
import { db } from "@/lib/prisma";
import { generateJSON } from "@/lib/ai/gemini";
import { atsMatchPrompt } from "@/lib/ai/prompts";
import { createNotification } from "@/lib/notifications";

/**
 * Score a user's resume against a JD (preferred) or their industry standard.
 * Persists `atsScore` + `feedback` (JSON-stringified) and fires an ats_score
 * notification. Returns the updated resume row + the raw ATS result.
 *
 * @param {string} userId
 * @param {{ jobDescription?: string|null, resumeId?: string|null, client?: any }} [opts]
 * @returns {Promise<object|null>} `{ resume, atsResult }` or null if no resume
 */
export async function scoreResumeAgainstTarget(userId, opts = {}) {
  if (!userId) return null;
  const client = opts.client ?? db;

  const user = await client.user.findUnique({
    where: { id: userId },
    select: { id: true, industry: true },
  });
  if (!user) return null;

  const resume = opts.resumeId
    ? await client.resume.findUnique({ where: { id: opts.resumeId } })
    : await client.resume.findUnique({ where: { userId } });
  if (!resume?.content) return null;

  // Build the "JD": the supplied JD, or an industry brief from IndustryInsight.
  let jd = opts.jobDescription;
  if (!jd) {
    const insight = user.industry
      ? await client.industryInsight.findUnique({
          where: { industry: user.industry },
          select: { topSkills: true, recommendedSkills: true, demandLevel: true, keyTrends: true },
        })
      : null;
    const skills = [...(insight?.topSkills || []), ...(insight?.recommendedSkills || [])].filter(
      Boolean
    );
    jd = [
      `Target industry: ${user.industry || "general technology"}.`,
      insight?.demandLevel ? `Demand level: ${insight.demandLevel}.` : "",
      skills.length ? `Expected skills: ${Array.from(new Set(skills)).join(", ")}.` : "",
      insight?.keyTrends?.length ? `Key trends: ${insight.keyTrends.join("; ")}.` : "",
      "Assess the resume's general fit for a typical role in this industry.",
    ]
      .filter(Boolean)
      .join("\n");
  }

  let result;
  try {
    result = await generateJSON(atsMatchPrompt(resume.content, jd));
  } catch (e) {
    console.error("[NovaNest] scoreResumeAgainstTarget generate failed:", e?.message);
    return null;
  }

  const updated = await client.resume.update({
    where: { id: resume.id },
    data: {
      atsScore: Number(result?.score ?? 0),
      feedback: JSON.stringify(result ?? {}),
    },
  });

  createNotification(userId, {
    type: "ats_score",
    title: `Resume ATS score: ${Math.round(Number(result?.score ?? 0))}%`,
    body: "Matched and missing keywords are now on your resume. Tweak to close the gap.",
    href: "/resume",
    data: { score: Number(result?.score ?? 0), background: true },
  }).catch((e) => console.error("[NovaNest] resume ats notify:", e?.message));

  return { resume: updated, atsResult: result };
}