"use server";

import { db } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { generateJSON, generateText } from "@/lib/ai/gemini";
import { atsMatchPrompt, improveEntryPrompt } from "@/lib/ai/prompts";
import { rateLimit } from "@/lib/rate-limit";
import { improveEntrySchema } from "@/lib/schemas";
import { ValidationError, NotFoundError } from "@/lib/errors";
import { bumpActivity } from "@/lib/gamify";
import { createNotification } from "@/lib/notifications";
import { revalidatePath } from "next/cache";
import { fromResume } from "@/lib/career/memory/memory-extractors";
import { recordTimelineEvent } from "@/lib/career/timeline/timeline-engine";
import { deriveFromResume } from "@/lib/career/timeline/timeline-derivers";
import { inngest } from "@/lib/inngest/client";

export async function saveResume(content) {
  const user = await requireUser();

  try {
    const resume = await db.resume.upsert({
      where: { userId: user.id },
      update: { content },
      create: { userId: user.id, content },
    });

    bumpActivity(user.id, "resume_saved").catch((e) =>
      console.error("[NovaNest] bumpActivity resume_saved:", e?.message)
    );

    fromResume(user.id, resume).catch((e) =>
      console.error("[NovaNest] fromResume memory:", e?.message)
    );

    recordTimelineEvent({ userId: user.id, ...deriveFromResume(resume) }).catch((e) =>
      console.error("[NovaNest] timeline resume:", e?.message)
    );

    inngest
      .send({ name: "resume/saved", data: { userId: user.id, resumeId: resume.id } })
      .catch((e) => console.error("[NovaNest] resume/saved dispatch:", e?.message));

    revalidatePath("/resume");
    revalidatePath("/dashboard");
    return resume;
  } catch (error) {
    console.error("[NovaNest] saveResume failed:", error?.message);
    throw new Error("Failed to save resume. Please try again.");
  }
}

export async function getResume() {
  const user = await requireUser();

  return await db.resume.findUnique({
    where: { userId: user.id },
  });
}

export async function improveWithAI({ current, type }) {
  const user = await requireUser();

  const parsed = improveEntrySchema.safeParse({ current, type });
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues?.[0]?.message ?? "Invalid input.");
  }

  rateLimit({ key: `improve:${user.clerkUserId}`, limit: 20, windowMs: 5 * 60_000 });

  const prompt = improveEntryPrompt(user.industry, parsed.data.type, parsed.data.current);

  try {
    return await generateText(prompt);
  } catch (error) {
    throw error instanceof Error && error.message
      ? error
      : new Error("Failed to improve content. Please try again.");
  }
}

export async function scoreResume(jobDescription) {
  const user = await requireUser({ select: { id: true, industry: true } });

  rateLimit({
    key: `resume-score:${user.clerkUserId}`,
    limit: 15,
    windowMs: 10 * 60_000,
  });

  const resume = await db.resume.findUnique({ where: { userId: user.id } });
  if (!resume?.content) {
    throw new NotFoundError("Save a resume first, then we can score it.");
  }

  let jd = jobDescription;
  if (!jd) {
    const insight = user.industry
      ? await db.industryInsight.findUnique({
          where: { industry: user.industry },
          select: { topSkills: true, recommendedSkills: true, demandLevel: true, keyTrends: true },
        })
      : null;
    const skills = [
      ...(insight?.topSkills || []),
      ...(insight?.recommendedSkills || []),
    ].filter(Boolean);
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

  const result = await generateJSON(atsMatchPrompt(resume.content, jd));

  const updated = await db.resume.update({
    where: { id: resume.id },
    data: {
      atsScore: Number(result?.score ?? 0),
      feedback: JSON.stringify(result ?? {}),
    },
  });

  const oldScore = resume.atsScore;
  const newScore = updated.atsScore;
  if (typeof oldScore === "number" && typeof newScore === "number" && newScore > oldScore) {
    recordTimelineEvent({
      userId: user.id,
      type: "achievement",
      title: `Resume ATS score reached ${Math.round(newScore)}%`,
      description: `Up from ${Math.round(oldScore)}% — keep closing the keyword gap.`,
      metadata: { resumeId: resume.id, from: oldScore, to: newScore },
      sourceType: "resume",
      sourceId: `${resume.id}#ats-${Math.round(newScore)}`,
    }).catch((e) => console.error("[NovaNest] timeline ats:", e?.message));
  }

  createNotification(user.id, {
    type: "ats_score",
    title: `Resume ATS score: ${Math.round(Number(result?.score ?? 0))}%`,
    body: "Matched and missing keywords are now on your resume. Tweak to close the gap.",
    href: "/resume",
    data: { score: Number(result?.score ?? 0) },
  }).catch((e) => console.error("[NovaNest] resume ats notify:", e?.message));

  revalidatePath("/resume");
  revalidatePath("/dashboard");
  return { ...updated, atsResult: result };
}