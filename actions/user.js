"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { requireUser } from "@/lib/auth";
import { onboardingSchema } from "@/lib/schemas";
import { ValidationError } from "@/lib/errors";
import { revalidatePath } from "next/cache";
import { generateAIInsights } from "./dashboard";
import { industries } from "@/data/industries";

/**
 * Persist onboarding data. Creates the matching IndustryInsight row (generating
 * it via Gemini if it doesn't exist yet) within a transaction.
 *
 * Returns `{ success: true, user }` so the onboarding form can reliably detect
 * completion and redirect. (Previously this returned `result.user`, which was
 * `undefined` since `result` was `{ updatedUser, industryInsight }` — so the
 * form's success branch never fired.)
 */
export async function updateUser(data) {
  const user = await requireUser();

  const parsed = onboardingSchema.safeParse(data);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues?.[0]?.message ?? "Invalid profile data.");
  }

  try {
    const result = await db.$transaction(
      async (tx) => {
        let industryInsight = await tx.industryInsight.findUnique({
          where: { industry: parsed.data.industry },
        });

        if (!industryInsight) {
          const insights = await generateAIInsights(parsed.data.industry);
          industryInsight = await tx.industryInsight.create({
            data: {
              industry: parsed.data.industry,
              ...insights,
              nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
          });
        }

        const updatedUser = await tx.user.update({
          where: { id: user.id },
          data: {
            industry: parsed.data.industry,
            experience: parsed.data.experience,
            bio: parsed.data.bio,
            skills: parsed.data.skills,
          },
        });

        return { updatedUser, industryInsight };
      },
      { timeout: 10000 }
    );

    revalidatePath("/");
    return { success: true, user: result.updatedUser };
  } catch (error) {
    console.error("[NovaNest] updateUser failed:", error?.message);
    throw new Error(error?.message || "Failed to update profile. Please try again.");
  }
}

export async function getUserOnboardingStatus() {
  // Returns gracefully when there's no session — this is called from server
  // components (onboarding/dashboard pages) that may run before auth resolves.
  const { userId } = await auth();
  if (!userId) return { isOnboarded: false };

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    select: { industry: true },
  });

  if (!user) return { isOnboarded: false };

  return { isOnboarded: !!user.industry };
}

/**
 * Build the combined industry slug the app stores on User.industry, matching
 * the onboarding form's format: `${industryId}-${subIndustry}` where the
 * sub-industry is lowercased and spaces become dashes.
 */
function buildIndustrySlug(industryId, subIndustry) {
  return `${industryId}-${subIndustry.toLowerCase().replace(/ /g, "-")}`;
}

/**
 * Let an onboarded user switch the industry they track. Validates the choice
 * against the known industry list, updates `user.industry` (which re-points
 * the User→IndustryInsight relation automatically), and best-effort generates
 * fresh insights for the new industry so the dashboard shows its trends on the
 * next load. If insight generation fails (e.g. AI down/quota), the industry
 * still changes — getIndustryInsights will retry on demand from the dashboard.
 */
export async function changeIndustry({ industry, subIndustry }) {
  const user = await requireUser();

  if (!industry || !subIndustry) {
    throw new ValidationError("Please choose an industry and a specialization.");
  }

  const ind = industries.find((i) => i.id === industry);
  if (!ind || !ind.subIndustries.includes(subIndustry)) {
    throw new ValidationError("That industry or specialization isn't available.");
  }

  const slug = buildIndustrySlug(industry, subIndustry);

  // No-op if they re-selected their current industry.
  if (user.industry === slug) {
    return { success: true, industry: slug, unchanged: true };
  }

  try {
    // The User→IndustryInsight relation is enforced by a foreign key on
    // User.industry, so the IndustryInsight row for the new slug MUST exist
    // before we can point the user at it. Ensure it exists first (generate via
    // AI if it doesn't), then update the user.
    const existing = await db.industryInsight.findUnique({
      where: { industry: slug },
    });
    if (!existing) {
      const insights = await generateAIInsights(slug);
      // upsert guards against a concurrent request creating the same row.
      await db.industryInsight.upsert({
        where: { industry: slug },
        update: {
          ...insights,
          lastUpdated: new Date(),
          nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
        create: {
          industry: slug,
          ...insights,
          nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    }

    await db.user.update({
      where: { id: user.id },
      data: { industry: slug },
    });

    revalidatePath("/dashboard");
    revalidatePath("/");
    return { success: true, industry: slug };
  } catch (error) {
    console.error("[NovaNest] changeIndustry failed:", error?.message);
    throw new Error(error?.message || "Couldn't change your industry. Please try again.");
  }
}