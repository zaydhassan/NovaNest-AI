"use server";

import { db } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { generateJSON, generateText } from "@/lib/ai/gemini";
import { quizPrompt, improvementTipPrompt } from "@/lib/ai/prompts";
import { rateLimit } from "@/lib/rate-limit";
import { saveQuizResultSchema } from "@/lib/schemas";
import { ValidationError } from "@/lib/errors";
import { bumpActivity } from "@/lib/gamify";
import { createNotification } from "@/lib/notifications";
import { fromQuiz } from "@/lib/career/memory/memory-extractors";
import { recordTimelineEvent } from "@/lib/career/timeline/timeline-engine";
import { deriveFromAssessment } from "@/lib/career/timeline/timeline-derivers";
import { resolveCompanyContext } from "@/lib/career/dream-company/company-context";
import { revalidatePath } from "next/cache";

export async function generateQuiz(companySlug = null) {
  const user = await requireUser();

  rateLimit({ key: `quiz:${user.clerkUserId}`, limit: 8, windowMs: 10 * 60_000 });

  try {
    const company = await resolveCompanyContext(companySlug);
    const quiz = await generateJSON(quizPrompt(user.industry, user.skills, company));
    if (!Array.isArray(quiz?.questions)) {
      throw new Error("The AI returned an unexpected quiz format.");
    }
    return quiz.questions;
  } catch (error) {
    console.error("[NovaNest] generateQuiz failed:", error?.message);
    throw new Error(error?.message || "Failed to generate quiz questions.");
  }
}

export async function saveQuizResult(questions, answers, score, company = null) {
  const user = await requireUser();

  const parsed = saveQuizResultSchema.safeParse({ questions, answers, score, company });
  if (!parsed.success) {
    throw new ValidationError("Invalid quiz submission.");
  }
  const companySlug = parsed.data.company || null;

  const questionResults = questions.map((q, index) => ({
    question: q.question,
    answer: q.correctAnswer,
    userAnswer: answers[index],
    isCorrect: q.correctAnswer === answers[index],
    explanation: q.explanation,
  }));

  const wrongAnswers = questionResults.filter((q) => !q.isCorrect);

  let improvementTip = null;
  if (wrongAnswers.length > 0) {
    const wrongQuestionsText = wrongAnswers
      .map(
        (q) =>
          `Question: "${q.question}"\nCorrect Answer: "${q.answer}"\nUser Answer: "${q.userAnswer}"`
      )
      .join("\n\n");

    try {
      const companyCtx = await resolveCompanyContext(companySlug);
      improvementTip = await generateText(
        improvementTipPrompt(user.industry, wrongQuestionsText, companyCtx)
      );
    } catch (error) {
      console.error("[NovaNest] improvementTip failed:", error?.message);
    }
  }

  try {
    const assessment = await db.assessment.create({
      data: {
        userId: user.id,
        quizScore: score,
        questions: questionResults,
        category: "Technical",
        company: companySlug,
        improvementTip,
      },
    });

    bumpActivity(user.id, "quiz_completed").catch((e) =>
      console.error("[NovaNest] bumpActivity quiz_completed:", e?.message)
    );
    createNotification(user.id, {
      type: "quiz_completed",
      title: `Quiz complete: ${Math.round(score)}%`,
      body: improvementTip
        ? "Check your improvement tip and keep your streak going."
        : "Nice work — keep your streak going with another quiz.",
      href: "/interview",
      data: { score },
    }).catch((e) => console.error("[NovaNest] quiz notify:", e?.message));

    fromQuiz(user.id, assessment).catch((e) =>
      console.error("[NovaNest] fromQuiz memory:", e?.message)
    );

    recordTimelineEvent({ userId: user.id, ...deriveFromAssessment(assessment) }).catch((e) =>
      console.error("[NovaNest] timeline quiz:", e?.message)
    );

    revalidatePath("/dashboard");

    return assessment;
  } catch (error) {
    console.error("[NovaNest] saveQuizResult failed:", error?.message);
    throw new Error("Failed to save quiz result. Please try again.");
  }
}

export async function getAssessments() {
  const user = await requireUser();

  try {
    const assessments = await db.assessment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    });

    return assessments;
  } catch (error) {
    console.error("[NovaNest] getAssessments failed:", error?.message);
    throw new Error("Failed to fetch assessments. Please try again.");
  }
}