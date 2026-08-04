"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { requireUser } from "@/lib/auth";
import { onboardingSchema } from "@/lib/schemas";
import { ValidationError } from "@/lib/errors";
import { revalidatePath } from "next/cache";
import { generateAIInsights } from "./dashboard";
import { industries } from "@/data/industries";
import { bumpActivity } from "@/lib/gamify";
import { createNotification } from "@/lib/notifications";
import { fromOnboarding } from "@/lib/career/memory/memory-extractors";

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

        await createNotification(user.id, {
          type: "insights_ready",
          title: "Your industry insights are ready 📊",
          body: "We've generated salary ranges, growth, demand, and a personalized skill-gap analysis for your field.",
          href: "/dashboard",
          tx,
        });

        try {
          await fromOnboarding(user.id, parsed.data, tx);
        } catch (memErr) {
          console.error("[NovaNest] fromOnboarding memory:", memErr?.message);
        }

        return { updatedUser, industryInsight };
      },
      { timeout: 10000 }
    );

    bumpActivity(user.id, "onboarding").catch((e) =>
      console.error("[NovaNest] bumpActivity onboarding:", e?.message)
    );
    revalidatePath("/");
    return { success: true, user: result.updatedUser };
  } catch (error) {
    console.error("[NovaNest] updateUser failed:", error?.message);
    throw new Error(error?.message || "Failed to update profile. Please try again.");
  }
}

export async function getUserOnboardingStatus() {
  const { userId } = await auth();
  if (!userId) return { isOnboarded: false };

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    select: { industry: true },
  });

  if (!user) return { isOnboarded: false };

  return { isOnboarded: !!user.industry };
}

function buildIndustrySlug(industryId, subIndustry) {
  return `${industryId}-${subIndustry.toLowerCase().replace(/ /g, "-")}`;
}

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

  if (user.industry === slug) {
    return { success: true, industry: slug, unchanged: true };
  }

  try {
    const existing = await db.industryInsight.findUnique({
      where: { industry: slug },
    });
    if (!existing) {
      const insights = await generateAIInsights(slug);
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

    createNotification(user.id, {
      type: "industry_changed",
      title: "Insights refreshed for your new field 🔄",
      body: "We've updated your dashboard with salary, growth, and skill trends for your new industry.",
      href: "/dashboard",
      data: { industry: slug },
    }).catch((e) => console.error("[NovaNest] industry_changed notify:", e?.message));

    revalidatePath("/dashboard");
    revalidatePath("/");
    return { success: true, industry: slug };
  } catch (error) {
    console.error("[NovaNest] changeIndustry failed:", error?.message);
    throw new Error(error?.message || "Couldn't change your industry. Please try again.");
  }
}