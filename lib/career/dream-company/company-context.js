import { db } from "@/lib/prisma";

/**
 * Build the compact `company` context object the prompt builders consume
 * (the trailing optional `company` arg). Only the fields the prompts cite are
 * carried — never the full row. `null` in → `null` out (the no-regression guard
 * for the interview enhancement: when no company is selected, every prompt gets
 * `null` and stays byte-identical to the baseline).
 *
 * Server-only (touches the DB via resolveCompanyContext). NOT a Server Action
 * module — exported as plain functions so the interview actions can import
 * them without violating Next.js's "async-only exports" rule for action files.
 */
export function companyContextFromProfile(profile) {
  if (!profile) return null;
  return {
    displayName: profile.displayName,
    values: profile.values ?? [],
    bar: profile.bar ?? null,
    topSkills: profile.topSkills ?? [],
    recommendedSkills: profile.recommendedSkills ?? [],
    interviewThemes: profile.interviewThemes ?? [],
    famousQuestions: profile.famousQuestions ?? [],
  };
}

/**
 * Resolve a company's `company` context object by slug, with a single cheap
 * read. Returns `null` when the slug is falsy OR no profile exists yet — the
 * caller then passes `null` to the prompt, preserving byte-identical behavior.
 * Shared by the interview actions (nextInterviewQuestion / generateQuiz / …)
 * so they don't each re-implement the lookup.
 */
export async function resolveCompanyContext(companySlug) {
  if (!companySlug) return null;
  const profile = await db.companyProfile.findUnique({
    where: { company: companySlug },
  });
  return companyContextFromProfile(profile);
}