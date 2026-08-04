"use server";

import { db } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { generateText } from "@/lib/ai/gemini";
import { rateLimit } from "@/lib/rate-limit";
import { NotFoundError, withErrorHandling } from "@/lib/errors";
import { buildPrompt } from "@/lib/career/prompts/prompt-service";
import { recallMemory } from "@/lib/career/memory/memory-service";
import { inngest } from "@/lib/inngest/client";
import { gatherTwinSources, buildTwinProfile } from "@/lib/career/twin/twin-builder";
import { revalidatePath } from "next/cache";

export const getTwin = withErrorHandling(async function getTwin() {
  const user = await requireUser({ select: { id: true, twinVersion: true } });
  const twin = await db.careerTwin.findUnique({
    where: { userId: user.id },
    select: { id: true, profile: true, version: true, lastUpdatedAt: true, updatedAt: true },
  });
  return twin;
}, "Couldn't load your Career Twin. Please try again.");

export const rebuildTwin = withErrorHandling(async function rebuildTwin() {
  const user = await requireUser({ select: { id: true, clerkUserId: true, twinVersion: true } });
  rateLimit({ key: `twin-rebuild:${user.clerkUserId}`, limit: 5, windowMs: 10 * 60_000 });

  try {
    await inngest.send({
      name: "twin/rebuild.requested",
      data: { userId: user.id },
    });
    revalidatePath("/twin");
    return { dispatched: true };
  } catch (e) {
    console.error("[NovaNest] twin/rebuild.requested dispatch:", e?.message);
    const sources = await gatherTwinSources(user.id);
    const built = await buildTwinProfile(sources);
    if (!built.twin) {
      throw new Error(built.error || "Couldn't build your Career Twin. Please try again.");
    }
    const nextVersion = (user.twinVersion ?? 0) + 1;
    await db.careerTwin.upsert({
      where: { userId: user.id },
      update: { profile: built.twin, version: nextVersion, lastUpdatedAt: new Date() },
      create: { userId: user.id, profile: built.twin, version: 1 },
    });
    await db.user.update({ where: { id: user.id }, data: { twinVersion: nextVersion } });
    revalidatePath("/twin");
    return { dispatched: false, built: true, version: nextVersion };
  }
}, "Couldn't rebuild your Career Twin. Please try again.");

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