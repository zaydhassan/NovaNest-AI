"use server";

import { db } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { NotFoundError, ValidationError, withErrorHandling } from "@/lib/errors";

/**
 * List the signed-in user's chat sessions, newest-first, with a message count.
 * Archived sessions are excluded by default (pass { includeArchived: true }).
 */
export const listChatSessions = withErrorHandling(async function listChatSessions({
  includeArchived,
} = {}) {
  const user = await requireUser({ select: { id: true } });
  return db.chatSession.findMany({
    where: {
      userId: user.id,
      ...(includeArchived ? {} : { archived: false }),
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      archived: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { messages: true } },
    },
    take: 50,
  });
}, "Couldn't load your conversations. Please try again.");

/**
 * Get one chat session with its messages (oldest-first for rendering).
 */
export const getChatSession = withErrorHandling(async function getChatSession(id) {
  const user = await requireUser({ select: { id: true } });
  if (!id) throw new ValidationError("A conversation id is required.");

  const session = await db.chatSession.findFirst({
    where: { id, userId: user.id },
    select: {
      id: true,
      title: true,
      archived: true,
      createdAt: true,
      messages: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          role: true,
          content: true,
          data: true,
          createdAt: true,
        },
      },
    },
  });
  if (!session) throw new NotFoundError("That conversation wasn't found.");
  return session;
}, "Couldn't open that conversation. Please try again.");

/**
 * Archive (soft-delete from the sidebar) a chat session.
 */
export const archiveChatSession = withErrorHandling(async function archiveChatSession(id) {
  const user = await requireUser({ select: { id: true } });
  if (!id) throw new ValidationError("A conversation id is required.");
  const res = await db.chatSession.updateMany({
    where: { id, userId: user.id },
    data: { archived: true },
  });
  if (!res.count) throw new NotFoundError("That conversation wasn't found.");
  return { success: true };
}, "Couldn't archive that conversation. Please try again.");

/**
 * Create a new empty chat session (used by the /coach sidebar "new chat").
 * Rate-limited to keep the session list tidy.
 */
export const createChatSession = withErrorHandling(async function createChatSession(title) {
  const user = await requireUser({ select: { id: true, clerkUserId: true } });
  rateLimit({ key: `chat-session:${user.clerkUserId}`, limit: 20, windowMs: 10 * 60_000 });
  const session = await db.chatSession.create({
    data: {
      userId: user.id,
      title: String(title || "New conversation").slice(0, 120),
    },
  });
  return { id: session.id, title: session.title };
}, "Couldn't start a new conversation. Please try again.");