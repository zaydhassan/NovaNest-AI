"use server";

import { db } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { generateText } from "@/lib/ai/gemini";
import { improveEntryPrompt } from "@/lib/ai/prompts";
import { rateLimit } from "@/lib/rate-limit";
import { improveEntrySchema } from "@/lib/schemas";
import { ValidationError } from "@/lib/errors";
import { bumpActivity } from "@/lib/gamify";
import { revalidatePath } from "next/cache";

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