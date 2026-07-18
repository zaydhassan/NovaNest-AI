"use server";

import { db } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { generateJSON, generateText } from "@/lib/ai/gemini";
import {
  mockInterviewQuestionPrompt,
  mockInterviewScorePrompt,
} from "@/lib/ai/prompts";
import { rateLimit } from "@/lib/rate-limit";
import { mockInterviewSchema } from "@/lib/schemas";
import { ValidationError } from "@/lib/errors";
import { bumpActivity } from "@/lib/gamify";
import { revalidatePath } from "next/cache";

/**
 * Ask the AI interviewer for the next question, given the role and the
 * transcript so far.
 */
export async function nextInterviewQuestion(role, industry, transcript) {
  const user = await requireUser();
  if (!role || typeof role !== "string") {
    throw new ValidationError("A target role is required.");
  }
  rateLimit({
    key: `mock-q:${user.clerkUserId}`,
    limit: 40,
    windowMs: 10 * 60_000,
  });

  const soFar = Array.isArray(transcript)
    ? transcript
        .map((t) => `${t.role === "interviewer" ? "Interviewer" : "Candidate"}: ${t.text}`)
        .join("\n")
    : "";

  return generateText(mockInterviewQuestionPrompt(role, industry, soFar));
}

/**
 * Score a finished interview transcript. Persists the MockInterview row with
 * the transcript, score, and structured feedback.
 */
export async function scoreMockInterview(input) {
  const user = await requireUser();

  const parsed = mockInterviewSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(
      parsed.error.issues?.[0]?.message ?? "Invalid interview data."
    );
  }
  if (parsed.data.transcript.length < 2) {
    throw new ValidationError("Run at least one full Q&A exchange before scoring.");
  }

  rateLimit({
    key: `mock-score:${user.clerkUserId}`,
    limit: 10,
    windowMs: 10 * 60_000,
  });

  const flat = parsed.data.transcript
    .map((t) => `${t.role === "interviewer" ? "Interviewer" : "Candidate"}: ${t.text}`)
    .join("\n");

  const result = await generateJSON(
    mockInterviewScorePrompt(parsed.data.role, user.industry, flat)
  );

  const score = Number(result?.score ?? 0);
  const feedback = JSON.stringify(result ?? {});

  const record = await db.mockInterview.create({
    data: {
      userId: user.id,
      role: parsed.data.role,
      industry: user.industry,
      transcript: parsed.data.transcript,
      score,
      feedback,
    },
  });

  bumpActivity(user.id, "mock_interview").catch((e) =>
    console.error("[NovaNest] bumpActivity mock_interview:", e?.message)
  );
  revalidatePath("/dashboard");
  revalidatePath("/interview");

  return { ...record, scored: result };
}

export async function getMockInterviews() {
  const user = await requireUser();
  return db.mockInterview.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      role: true,
      industry: true,
      score: true,
      feedback: true,
      createdAt: true,
    },
  });
}