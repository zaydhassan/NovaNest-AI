"use server";

import { db } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { generateJSON } from "@/lib/ai/gemini";
import {
  companyProfilePrompt,
  dreamCompanyPlanPrompt,
  atsMatchPrompt,
} from "@/lib/ai/prompts";
import { rateLimit } from "@/lib/rate-limit";
import { targetCompanySchema } from "@/lib/schemas";
import { ValidationError, NotFoundError, withErrorHandling } from "@/lib/errors";
import { DREAM_COMPANY_BY_SLUG } from "@/lib/constants";
import { companyContextFromProfile } from "@/lib/career/dream-company/company-context";
import { revalidatePath } from "next/cache";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// NOTE: `companyContextFromProfile` + `resolveCompanyContext` live in the
// non-action lib module above. The interview actions import them directly
// from there — re-exporting non-async values from a "use server" module would
// violate Next.js's async-only-exports rule.

/**
 * Set the signed-in user's dream-company target. `company` must be one of the
 * DREAM_COMPANY_SLUGS (validated via targetCompanySchema). If the target
 * actually changes, any existing DreamCompanyPlan is deleted so the next read
 * regenerates against the new company. `ensureOnboarded()` keys off `industry`
 * only, so this never blocks onboarding.
 */
export async function setTargetCompany(company) {
  const user = await requireUser({ select: { id: true, clerkUserId: true, targetCompany: true } });

  const parsed = targetCompanySchema.safeParse({ company });
  if (!parsed.success) {
    throw new ValidationError(
      parsed.error.issues?.[0]?.message ?? "Please pick a valid company."
    );
  }
  const slug = parsed.data.company;
  const displayName = DREAM_COMPANY_BY_SLUG[slug]?.name ?? slug;

  const changed = user.targetCompany !== slug;

  // The User.targetCompany FK references CompanyProfile.company, so the
  // profile row must exist BEFORE we write the target. The full profile is
  // AI-generated on demand by getOrGenerateCompanyProfile (on the next render),
  // but we can't wait for that here — and we don't want to block "pick a
  // company" on a synchronous AI call. So we upsert a minimal stub now (no AI,
  // cheap) to satisfy the FK; getOrGenerateCompanyProfile detects an incomplete
  // stub (empty salaryRanges + topSkills) and regenerates the real fields.
  await db.companyProfile.upsert({
    where: { company: slug },
    update: {},
    create: {
      company: slug,
      displayName,
      salaryRanges: [],
      topSkills: [],
      recommendedSkills: [],
      famousQuestions: [],
      values: [],
      keyTrends: [],
      nextUpdate: new Date(0),
    },
  });

  await db.user.update({
    where: { id: user.id },
    data: { targetCompany: slug },
  });

  // Force a plan regen on company change — drop the stale plan.
  if (changed) {
    await db.dreamCompanyPlan.deleteMany({ where: { userId: user.id } }).catch(() => {});
  }

  revalidatePath("/dream-company");
  return { company: slug, name: DREAM_COMPANY_BY_SLUG[slug]?.name ?? slug };
}

/**
 * Clear the dream-company target + its cached plan.
 */
export async function clearTargetCompany() {
  const user = await requireUser({ select: { id: true } });
  await db.user.update({ where: { id: user.id }, data: { targetCompany: null } });
  await db.dreamCompanyPlan.deleteMany({ where: { userId: user.id } }).catch(() => {});
  revalidatePath("/dream-company");
  return { company: null };
}

/**
 * Read a CompanyProfile for the given slug, generating it on demand (rate-
 * limited) when missing. Mirrors `getIndustryInsights` exactly. Used by the
 * dashboard + by the interview actions' `resolveCompanyContext` (which reads
 * the row directly, so this is the on-demand bootstrap path).
 */
export async function getOrGenerateCompanyProfile(company) {
  if (!company || !DREAM_COMPANY_BY_SLUG[company]) {
    throw new ValidationError("Unknown company.");
  }
  const displayName = DREAM_COMPANY_BY_SLUG[company].name;

  const existing = await db.companyProfile.findUnique({ where: { company } });
  // A fully-generated profile always has salary ranges + skills. A stub
  // created by setTargetCompany (empty arrays) is treated as "needs
  // generation" and falls through to the AI upsert below.
  if (existing && (existing.salaryRanges?.length || existing.topSkills?.length)) {
    return existing;
  }

  rateLimit({ key: `company-profile:${company}`, limit: 5, windowMs: 10 * 60_000 });

  const profile = await generateJSON(companyProfilePrompt(company, displayName));

  // Guard against a race where another request created the row first.
  return db.companyProfile.upsert({
    where: { company },
    update: {
      ...profile,
      displayName,
      lastUpdated: new Date(),
      nextUpdate: new Date(Date.now() + WEEK_MS),
    },
    create: {
      company,
      displayName,
      ...profile,
      nextUpdate: new Date(Date.now() + WEEK_MS),
    },
  });
}

/**
 * Gather the candidate-side context for the plan prompt: active goal, recent
 * mock-interview weaknesses, and the user's profile. Mirrors the shape
 * `dreamCompanyPlanPrompt` expects as `userProfile`. Server-only helper.
 */
async function gatherDreamCompanyUserContext(userId) {
  const [user, goal, mocks] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { industry: true, experience: true, skills: true, bio: true },
    }),
    db.careerGoal.findFirst({
      where: { userId, status: "active" },
      orderBy: { updatedAt: "desc" },
      select: { targetRole: true, targetLevel: true, timeframe: true },
    }),
    db.mockInterview.findMany({
      where: { userId },
      select: { improvements: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  // Flatten recent mock-interview improvement bullets into a deduped weakness
  // list (the highest-signal "what to work on" source).
  const seen = new Set();
  const recentMockWeaknesses = [];
  for (const m of mocks) {
    for (const imp of m.improvements || []) {
      const key = String(imp).toLowerCase().slice(0, 60);
      if (!seen.has(key)) {
        seen.add(key);
        recentMockWeaknesses.push(String(imp));
      }
      if (recentMockWeaknesses.length >= 8) break;
    }
    if (recentMockWeaknesses.length >= 8) break;
  }

  return {
    industry: user?.industry ?? null,
    experience: user?.experience ?? null,
    skills: user?.skills ?? [],
    bio: user?.bio ?? null,
    activeGoal: goal
      ? {
          targetRole: goal.targetRole,
          targetLevel: goal.targetLevel,
          timeframe: goal.timeframe,
        }
      : null,
    recentMockWeaknesses,
  };
}

/**
 * The main plan read: returns the cached DreamCompanyPlan if it's fresh (<7d
 * via nextUpdate) AND for the same company; otherwise regenerates. Requires
 * the user to have a `targetCompany` set. Rate-limited on the generation path.
 */
export const getOrGenerateDreamCompanyPlan = withErrorHandling(
  async function getOrGenerateDreamCompanyPlan() {
    const user = await requireUser({
      select: { id: true, clerkUserId: true, targetCompany: true },
    });
    if (!user.targetCompany) return null;

    const cached = await db.dreamCompanyPlan.findUnique({
      where: { userId: user.id },
    });

    const fresh =
      cached &&
      cached.company === user.targetCompany &&
      cached.nextUpdate &&
      new Date(cached.nextUpdate).getTime() > Date.now();

    if (fresh) return cached;

    // Generate. Resolve + bootstrap the company profile if needed.
    const profile = await getOrGenerateCompanyProfile(user.targetCompany);
    const userProfile = await gatherDreamCompanyUserContext(user.id);

    rateLimit({ key: `dream-plan:${user.clerkUserId}`, limit: 5, windowMs: 10 * 60_000 });

    const plan = await generateJSON(
      dreamCompanyPlanPrompt(userProfile, companyContextFromProfile(profile))
    );

    const generatedAt = new Date();
    return db.dreamCompanyPlan.upsert({
      where: { userId: user.id },
      update: {
        company: user.targetCompany,
        plan,
        generatedAt,
        nextUpdate: new Date(generatedAt.getTime() + WEEK_MS),
      },
      create: {
        userId: user.id,
        company: user.targetCompany,
        plan,
        generatedAt,
        nextUpdate: new Date(generatedAt.getTime() + WEEK_MS),
      },
    });
  },
  "Couldn't build your Dream Company plan. Please try again."
);

/**
 * Force a plan regeneration (the "Regenerate plan" button). Rate-limited
 * tighter than the on-demand path to bound spend.
 */
export const regenerateDreamCompanyPlan = withErrorHandling(
  async function regenerateDreamCompanyPlan() {
    const user = await requireUser({
      select: { id: true, clerkUserId: true, targetCompany: true },
    });
    if (!user.targetCompany) return null;

    const profile = await getOrGenerateCompanyProfile(user.targetCompany);
    const userProfile = await gatherDreamCompanyUserContext(user.id);

    rateLimit({ key: `dream-plan-regen:${user.clerkUserId}`, limit: 3, windowMs: 10 * 60_000 });

    const plan = await generateJSON(
      dreamCompanyPlanPrompt(userProfile, companyContextFromProfile(profile))
    );

    const generatedAt = new Date();
    return db.dreamCompanyPlan.upsert({
      where: { userId: user.id },
      update: {
        company: user.targetCompany,
        plan,
        generatedAt,
        nextUpdate: new Date(generatedAt.getTime() + WEEK_MS),
      },
      create: {
        userId: user.id,
        company: user.targetCompany,
        plan,
        generatedAt,
        nextUpdate: new Date(generatedAt.getTime() + WEEK_MS),
      },
    });
  },
  "Couldn't regenerate your plan. Please try again."
);

/**
 * Convenience: one parallel fetch for the /dream-company page — the user's
 * selected company meta, the company profile, and the cached/regenerated
 * plan. Returns `{ company: null }` when no target is set (the picker view).
 */
export const getDreamCompanyDashboard = withErrorHandling(
  async function getDreamCompanyDashboard() {
    const user = await requireUser({ select: { id: true, targetCompany: true } });
    if (!user.targetCompany || !DREAM_COMPANY_BY_SLUG[user.targetCompany]) {
      return { company: null, profile: null, plan: null };
    }

    const slug = user.targetCompany;
    const meta = DREAM_COMPANY_BY_SLUG[slug];

    // Profile first (may bootstrap on demand); then plan (which needs the
    // profile). Done sequentially on purpose — getOrGenerateDreamCompanyPlan
    // already resolves the profile internally, so just call it and read the
    // profile in parallel from the (now-cached) row.
    const plan = await getOrGenerateDreamCompanyPlan();
    const profile = await db.companyProfile.findUnique({ where: { company: slug } });

    return {
      company: { slug, name: meta.name, tagline: meta.tagline },
      profile,
      plan,
    };
  },
  "Couldn't load your Dream Company dashboard. Please try again."
);

/**
 * Score the user's saved resume against their target company (NOT a JD).
 * Builds a company brief from the CompanyProfile and passes the company
 * context to `atsMatchPrompt` so its `recommendations` are weighted toward the
 * company's values + bar. Separate from `actions/resume.js scoreResume`
 * (untouched) — this is a company-scoped read that returns the result without
 * persisting to the Resume row.
 */
export const scoreResumeForCompany = withErrorHandling(
  async function scoreResumeForCompany() {
    const user = await requireUser({
      select: { id: true, clerkUserId: true, targetCompany: true },
    });
    if (!user.targetCompany) {
      throw new ValidationError("Pick a dream company first.");
    }

    const [resume, profile] = await Promise.all([
      db.resume.findUnique({ where: { userId: user.id }, select: { id: true, content: true } }),
      db.companyProfile.findUnique({ where: { company: user.targetCompany } }),
    ]);
    if (!resume) throw new NotFoundError("Save a resume first, then score it against your dream company.");
    if (!profile) throw new NotFoundError("Company profile not ready yet — try again in a moment.");

    rateLimit({ key: `resume-company:${user.clerkUserId}`, limit: 10, windowMs: 10 * 60_000 });

    const companyCtx = companyContextFromProfile(profile);
    const companyBrief = [
      `Target company: ${profile.displayName}.`,
      profile.bar ? `Hiring bar: ${profile.bar}.` : "",
      profile.values?.length ? `Culture / values: ${profile.values.join(", ")}.` : "",
      [...(profile.topSkills || []), ...(profile.recommendedSkills || [])].length
        ? `Expected skills: ${Array.from(new Set([...profile.topSkills, ...profile.recommendedSkills])).join(", ")}.`
        : "",
      "Assess the resume's fit for a typical role at this company.",
    ]
      .filter(Boolean)
      .join("\n");

    return generateJSON(atsMatchPrompt(resume.content, companyBrief, companyCtx));
  },
  "Couldn't score your resume against your dream company. Please try again."
);

/**
 * The user's Application rows whose company name matches their dream company's
 * display name (case-insensitive contains). Shown in the strategy section as
 * "your activity at this company".
 */
export const getCompanyApplications = withErrorHandling(
  async function getCompanyApplications() {
    const user = await requireUser({ select: { id: true, targetCompany: true } });
    if (!user.targetCompany) return [];
    const meta = DREAM_COMPANY_BY_SLUG[user.targetCompany];
    if (!meta) return [];

    const rows = await db.application.findMany({
      where: { userId: user.id },
      select: { id: true, company: true, role: true, status: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });
    const needle = meta.name.toLowerCase();
    return rows.filter((r) => (r.company || "").toLowerCase().includes(needle));
  },
  "Couldn't load your applications at this company."
);