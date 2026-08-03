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

    // Best-effort gamification — never fail a successful save because of it.
    bumpActivity(user.id, "resume_saved").catch((e) =>
      console.error("[NovaNest] bumpActivity resume_saved:", e?.message)
    );

    // Career OS — extract identity + skill memories from the saved resume.
    // Idempotent (dedupes on source+sourceId+content), so re-saves never dupe.
    fromResume(user.id, resume).catch((e) =>
      console.error("[NovaNest] fromResume memory:", e?.message)
    );

    // Career OS — timeline "building" milestone. Idempotent on type+sourceId.
    recordTimelineEvent({ userId: user.id, ...deriveFromResume(resume) }).catch((e) =>
      console.error("[NovaNest] timeline resume:", e?.message)
    );

    // Career OS (M10) — dispatch a background ATS score against the user's
    // industry. Best-effort: a dispatch failure never blocks the save. The
    // on-demand scoreResume action still handles the JD-specific case live.
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

  // Boundary validation — keeps bad/malicious payloads away from the model.
  const parsed = improveEntrySchema.safeParse({ current, type });
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues?.[0]?.message ?? "Invalid input.");
  }

  // Rate-limit AI improvement to a sane per-user budget.
  rateLimit({ key: `improve:${user.clerkUserId}`, limit: 20, windowMs: 5 * 60_000 });

  const prompt = improveEntryPrompt(user.industry, parsed.data.type, parsed.data.current);

  try {
    return await generateText(prompt);
  } catch (error) {
    // generateText already maps to AIServiceError; surface its public message.
    throw error instanceof Error && error.message
      ? error
      : new Error("Failed to improve content. Please try again.");
  }
}

/**
 * Score the saved resume against a job description (preferred) or, when none is
 * supplied, against the user's industry standard (topSkills + recommendedSkills
 * from IndustryInsight). Persists `atsScore` + `feedback` (JSON-stringified)
 * on the Resume row so the resume builder + Application Detail + Career Health
 * can read it without re-running the model. This closes the M1-declared-but-
 * never-written gap.
 *
 * @param {string} [jobDescription] optional JD; falls back to industry brief.
 */
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

  // Build the "JD" to score against: the supplied JD, or an industry brief
  // synthesized from the user's IndustryInsight (no specific role in mind).
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

  // Career OS — timeline "achievement" milestone when the ATS score strictly
  // improves. Idempotent per score level: sourceId is `${resume.id}#ats-${n}`,
  // so re-reaching the same score dedupes while each new high watermark is a
  // fresh event. Fire-and-forget; never blocks the score write. (Live-only —
  // no score history is stored to backfill.)
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