"use server";

import { requireUser } from "@/lib/auth";
import { generateJSON, generateText } from "@/lib/ai/gemini";
import {
  rewriteAchievementPrompt,
  skillRoadmapPrompt,
  outreachMessagePrompt,
  jobFitPrompt,
} from "@/lib/ai/prompts";
import {
  rewriteAchievementSchema,
  roadmapSchema,
  outreachSchema,
  jobFitSchema,
} from "@/lib/schemas";
import { rateLimit } from "@/lib/rate-limit";
import { ValidationError } from "@/lib/errors";

/**
 * Rewrite a raw resume bullet into 3 quantified achievement variants (STAR/XYZ).
 */
export async function rewriteAchievement(input) {
  const user = await requireUser();
  const parsed = rewriteAchievementSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(
      parsed.error.issues?.[0]?.message ?? "Enter a bullet to rewrite."
    );
  }
  rateLimit({ key: `rewrite:${user.clerkUserId}`, limit: 20, windowMs: 5 * 60_000 });

  const out = await generateText(
    rewriteAchievementPrompt(user.industry, parsed.data.bullet)
  );
  const variants = String(out)
    .split(/\r?\n/)
    .map((s) => s.replace(/^[-*\d.)\s]+/, "").trim())
    .filter(Boolean)
    .slice(0, 3);
  return variants.length ? variants : [String(out).trim()];
}

/**
 * Generate an 8-week upskilling roadmap toward a target role.
 */
export async function generateRoadmap(input) {
  const user = await requireUser();
  const parsed = roadmapSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(
      parsed.error.issues?.[0]?.message ?? "Enter a target role."
    );
  }
  rateLimit({ key: `roadmap:${user.clerkUserId}`, limit: 8, windowMs: 10 * 60_000 });

  const currentSkills =
    parsed.data.currentSkills?.trim() || (user.skills?.join(", ") ?? "");
  return generateJSON(skillRoadmapPrompt(currentSkills, parsed.data.targetRole));
}

/**
 * Generate a cold-outreach message (LinkedIn note or email) tailored to the
 * user's background.
 */
export async function generateOutreach(input) {
  const user = await requireUser();
  const parsed = outreachSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(
      parsed.error.issues?.[0]?.message ?? "Company and role are required."
    );
  }
  rateLimit({ key: `outreach:${user.clerkUserId}`, limit: 15, windowMs: 10 * 60_000 });

  return generateText(
    outreachMessagePrompt(
      user,
      parsed.data.targetCompany,
      parsed.data.targetRole,
      parsed.data.kind || "linkedin"
    )
  );
}

/**
 * Score job-fit for a given JD against the user's profile and return what to
 * emphasize/address in a cover letter.
 */
export async function getJobFit(input) {
  const user = await requireUser();
  const parsed = jobFitSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(
      parsed.error.issues?.[0]?.message ?? "A job description is required."
    );
  }
  rateLimit({ key: `jobfit:${user.clerkUserId}`, limit: 15, windowMs: 10 * 60_000 });

  return generateJSON(jobFitPrompt(user, parsed.data.jobDescription));
}