"use server";

import { db } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { generateText } from "@/lib/ai/gemini";
import { coverLetterPrompt } from "@/lib/ai/prompts";
import { rateLimit } from "@/lib/rate-limit";
import { coverLetterSchema } from "@/lib/schemas";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { bumpActivity } from "@/lib/gamify";
import { revalidatePath } from "next/cache";

export async function generateCoverLetter(data) {
  const user = await requireUser();

  // Boundary validation.
  const parsed = coverLetterSchema.safeParse(data);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues?.[0]?.message ?? "Invalid cover letter input.");
  }

  rateLimit({ key: `cover-letter:${user.clerkUserId}`, limit: 12, windowMs: 10 * 60_000 });

  try {
    const content = await generateText(coverLetterPrompt(user, parsed.data));

    const coverLetter = await db.coverLetter.create({
      data: {
        content,
        jobDescription: parsed.data.jobDescription,
        companyName: parsed.data.companyName,
        jobTitle: parsed.data.jobTitle,
        status: "completed",
        userId: user.id,
      },
    });

    bumpActivity(user.id, "cover_letter").catch((e) =>
      console.error("[NovaNest] bumpActivity cover_letter:", e?.message)
    );
    revalidatePath("/dashboard");

    return coverLetter;
  } catch (error) {
    console.error("[NovaNest] generateCoverLetter failed:", error?.message);
    throw new Error(error?.message || "Failed to generate cover letter. Please try again.");
  }
}

export async function getCoverLetters() {
  const user = await requireUser();

  return await db.coverLetter.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCoverLetter(id) {
  const user = await requireUser();

  const coverLetter = await db.coverLetter.findUnique({
    where: { id, userId: user.id },
  });

  if (!coverLetter) throw new NotFoundError("Cover letter not found.");
  return coverLetter;
}

export async function deleteCoverLetter(id) {
  const user = await requireUser();

  try {
    return await db.coverLetter.delete({
      where: { id, userId: user.id },
    });
  } catch (error) {
    console.error("[NovaNest] deleteCoverLetter failed:", error?.message);
    throw new NotFoundError("Cover letter not found or already deleted.");
  }
}