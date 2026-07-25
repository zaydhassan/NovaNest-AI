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
import { createNotification } from "@/lib/notifications";
import { fromMock } from "@/lib/career/memory/memory-extractors";
import { recordTimelineEvent } from "@/lib/career/timeline/timeline-engine";
import { deriveFromMock } from "@/lib/career/timeline/timeline-derivers";
import { getInterviewTrendsData } from "@/lib/career/analytics/analytics-service";
import { withErrorHandling } from "@/lib/errors";
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
      // Career OS — denormalized fields (mirror of `feedback`) for queryable
      // interview-memory trend analysis without re-parsing the JSON string.
      questions: parsed.data.transcript
        ? parsed.data.transcript
            .filter((t) => t.role === "interviewer")
            .map((t) => ({ question: t.text }))
        : undefined,
      strengths: Array.isArray(result?.strengths) ? result.strengths : [],
      improvements: Array.isArray(result?.improvements) ? result.improvements : [],
      communicationScore: Number(result?.communication),
      technicalDepthScore: Number(result?.technicalDepth),
      structureScore: Number(result?.structure),
    },
  });

  bumpActivity(user.id, "mock_interview").catch((e) =>
    console.error("[NovaNest] bumpActivity mock_interview:", e?.message)
  );
  createNotification(user.id, {
    type: "mock_scored",
    title: `Mock interview scored ${Math.round(score)}/100`,
    body: `Your ${parsed.data.role} session is saved — review the feedback to improve.`,
    href: "/interview",
    data: { score, role: parsed.data.role },
  }).catch((e) => console.error("[NovaNest] mock notify:", e?.message));

  // Career OS — remember interview strengths/weaknesses + flagged skill gaps.
  // Idempotent (dedupes on source+sourceId+content); pure (uses the AI result).
  fromMock(user.id, record, result).catch((e) =>
    console.error("[NovaNest] fromMock memory:", e?.message)
  );

  // Career OS — timeline "interviewing" milestone. Idempotent on type+sourceId.
  recordTimelineEvent({ userId: user.id, ...deriveFromMock(record) }).catch((e) =>
    console.error("[NovaNest] timeline mock:", e?.message)
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

/**
 * Interview trend series for the /interview trend chart (M6). Wraps the pure
 * analytics helper so the client just calls a server action. Returns the
 * per-session score series + sub-metric averages + aggregate trend direction +
 * the most-repeated improvement topic.
 */
export const getInterviewTrends = withErrorHandling(
  async function getInterviewTrends(limit = 12) {
    const user = await requireUser({ select: { id: true } });
    return getInterviewTrendsData(user.id, { limit });
  },
  "Couldn't load your interview trends. Please try again."
);