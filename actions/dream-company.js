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

  if (changed) {
    await db.dreamCompanyPlan.deleteMany({ where: { userId: user.id } }).catch(() => {});
  }

  revalidatePath("/dream-company");
  return { company: slug, name: DREAM_COMPANY_BY_SLUG[slug]?.name ?? slug };
}

export async function clearTargetCompany() {
  const user = await requireUser({ select: { id: true } });
  await db.user.update({ where: { id: user.id }, data: { targetCompany: null } });
  await db.dreamCompanyPlan.deleteMany({ where: { userId: user.id } }).catch(() => {});
  revalidatePath("/dream-company");
  return { company: null };
}

export async function getOrGenerateCompanyProfile(company) {
  if (!company || !DREAM_COMPANY_BY_SLUG[company]) {
    throw new ValidationError("Unknown company.");
  }
  const displayName = DREAM_COMPANY_BY_SLUG[company].name;

  const existing = await db.companyProfile.findUnique({ where: { company } });
  if (existing && (existing.salaryRanges?.length || existing.topSkills?.length)) {
    return existing;
  }

  rateLimit({ key: `company-profile:${company}`, limit: 5, windowMs: 10 * 60_000 });

  const profile = await generateJSON(companyProfilePrompt(company, displayName));

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

export const getDreamCompanyDashboard = withErrorHandling(
  async function getDreamCompanyDashboard() {
    const user = await requireUser({ select: { id: true, targetCompany: true } });
    if (!user.targetCompany || !DREAM_COMPANY_BY_SLUG[user.targetCompany]) {
      return { company: null, profile: null, plan: null };
    }

    const slug = user.targetCompany;
    const meta = DREAM_COMPANY_BY_SLUG[slug];

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