"use server";

import { db } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { generateText } from "@/lib/ai/gemini";
import { rateLimit } from "@/lib/rate-limit";
import { NotFoundError, withErrorHandling } from "@/lib/errors";
import { buildPrompt } from "@/lib/career/prompts/prompt-service";
import { recallMemory } from "@/lib/career/memory/memory-service";
import { inngest } from "@/lib/inngest/client";
import { revalidatePath } from "next/cache";

/**
 * Get the signed-in user's built Career Twin (profile + version + lastUpdated).
 * Returns null if no twin has been built yet — the UI shows a build CTA.
 */
export const getTwin = withErrorHandling(async function getTwin() {
  const user = await requireUser({ select: { id: true, twinVersion: true } });
  const twin = await db.careerTwin.findUnique({
    where: { userId: user.id },
    select: { id: true, profile: true, version: true, lastUpdatedAt: true, updatedAt: true },
  });
  return twin;
}, "Couldn't load your Career Twin. Please try again.");

/**
 * Dispatch a background rebuild of the user's Career Twin. Returns immediately
 * with a pending state; the Inngest `rebuild-career-twin` job upserts the twin
 * and bumps `User.twinVersion`. Rate-limited so a client loop can't spam it.
 */
export const rebuildTwin = withErrorHandling(async function rebuildTwin() {
  const user = await requireUser({ select: { id: true, clerkUserId: true } });
  rateLimit({ key: `twin-rebuild:${user.clerkUserId}`, limit: 5, windowMs: 10 * 60_000 });

  try {
    await inngest.send({
      name: "twin/rebuild.requested",
      data: { userId: user.id },
    });
  } catch (e) {
    console.error("[NovaNest] twin/rebuild.requested dispatch:", e?.message);
    throw new Error("Couldn't start the rebuild. Please try again.");
  }

  revalidatePath("/twin");
  return { dispatched: true };
}, "Couldn't rebuild your Career Twin. Please try again.");

/**
 * Ask the user's Career Twin a question — answered in the user's voice,
 * grounded in the built profile + a few recalled memories. Requires a built
 * twin. Uses generateText for a natural prose reply (no streaming here; the
 * twin surface renders the full reply).
 */
export const twinChat = withErrorHandling(async function twinChat(question) {
  const user = await requireUser({ select: { id: true, clerkUserId: true } });
  if (!question || typeof question !== "string" || question.trim().length < 1) {
    throw new NotFoundError("Ask the twin a question first.");
  }
  rateLimit({ key: `twin-chat:${user.clerkUserId}`, limit: 20, windowMs: 60_000 });

  const twin = await db.careerTwin.findUnique({
    where: { userId: user.id },
    select: { profile: true, version: true },
  });
  if (!twin) {
    throw new NotFoundError("Build your Career Twin first, then ask it a question.");
  }

  const memories = await recallMemory({
    userId: user.id,
    query: question,
    limit: 6,
  });

  const prompt = buildPrompt("twinChat", { question, twin: twin.profile, memories });
  const reply = await generateText(prompt);
  return { reply, version: twin.version };
}, "Your Career Twin couldn't answer that. Please try again.");