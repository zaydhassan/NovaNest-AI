/**
 * Memory-extract dispatcher (M10) — re-runs the source-appropriate extractor
 * for a given {userId, source, sourceId} headlessly (no auth context). Used by
 * the Inngest `extract-memories-from-source` job for a deeper/refresh
 * re-extraction pass — every extractor is idempotent (dedupes on
 * userId+source+sourceId+content), so re-running is always safe.
 *
 * The inline extractors already run after each action; this job exists so a
 * scheduled or manually-triggered re-extraction can run without reconstructing
 * the action's auth context. Server-only.
 */
import { db } from "@/lib/prisma";
import { parseFeedback } from "@/lib/career/memory/interview-memory";
import {
  fromChat,
  fromMock,
  fromResume,
  fromApplication,
  fromQuiz,
  fromGitHub,
} from "@/lib/career/memory/memory-extractors";

/**
 * @param {{ userId: string, source: string, sourceId?: string|null }} input
 * @returns {Promise<object[]>} created MemoryEntry rows (may be empty)
 */
export async function reextractFromSource({ userId, source, sourceId }) {
  if (!userId || !source) return [];

  switch (source) {
    case "chat": {
      if (!sourceId) return [];
      // Re-run the AI-driven fromChat over the user message + its assistant reply.
      const userMsg = await db.chatMessage.findUnique({
        where: { id: sourceId },
        select: { id: true, sessionId: true, role: true, content: true, createdAt: true },
      });
      if (!userMsg || userMsg.role !== "user") return [];
      const assistantMsg = await db.chatMessage.findFirst({
        where: { sessionId: userMsg.sessionId, role: "assistant", createdAt: { gt: userMsg.createdAt } },
        orderBy: { createdAt: "asc" },
        select: { content: true },
      });
      return fromChat(userId, userMsg, userMsg.content, assistantMsg?.content ?? "");
    }

    case "mock":
    case "interview": {
      if (!sourceId) return [];
      const mock = await db.mockInterview.findUnique({
        where: { id: sourceId },
        select: { id: true, role: true, feedback: true, score: true, strengths: true, improvements: true },
      });
      if (!mock) return [];
      const parsed = parseFeedback(mock);
      return fromMock(userId, { id: mock.id, role: mock.role }, parsed);
    }

    case "resume": {
      const resume = sourceId
        ? await db.resume.findUnique({ where: { id: sourceId }, select: { id: true, content: true, atsScore: true } })
        : await db.resume.findUnique({ where: { userId }, select: { id: true, content: true, atsScore: true } });
      if (!resume) return [];
      return fromResume(userId, resume);
    }

    case "application": {
      if (!sourceId) return [];
      const app = await db.application.findUnique({
        where: { id: sourceId },
        select: { id: true, company: true, role: true, status: true },
      });
      if (!app) return [];
      return fromApplication(userId, app);
    }

    case "quiz": {
      if (!sourceId) return [];
      const assessment = await db.assessment.findUnique({
        where: { id: sourceId },
        select: { id: true, category: true, quizScore: true, improvementTip: true },
      });
      if (!assessment) return [];
      return fromQuiz(userId, assessment);
    }

    case "github": {
      if (!sourceId) return [];
      const repo = await db.gitHubRepo.findUnique({
        where: { id: sourceId },
        select: { id: true, fullName: true, language: true, analysis: true },
      });
      if (!repo) return [];
      return fromGitHub(userId, repo);
    }

    default:
      return [];
  }
}