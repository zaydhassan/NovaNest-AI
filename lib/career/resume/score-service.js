import { db } from "@/lib/prisma";
import { generateJSON } from "@/lib/ai/gemini";
import { atsMatchPrompt } from "@/lib/ai/prompts";
import { createNotification } from "@/lib/notifications";

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