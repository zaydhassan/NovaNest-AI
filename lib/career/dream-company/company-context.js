import { db } from "@/lib/prisma";

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

export async function resolveCompanyContext(companySlug) {
  if (!companySlug) return null;
  const profile = await db.companyProfile.findUnique({
    where: { company: companySlug },
  });
  return companyContextFromProfile(profile);
}