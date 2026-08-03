"use server";

import { db } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { connectRepoSchema } from "@/lib/schemas";
import { NotFoundError, ValidationError, withErrorHandling } from "@/lib/errors";
import { sha256 } from "@/lib/crypto";
import { inngest } from "@/lib/inngest/client";
import { revalidatePath } from "next/cache";

/**
 * Connect a GitHub repo for Senior-Engineer analysis. The repo row is created
 * `pending`, then the Inngest `analyze-github-repo` job is dispatched.
 *
 * PAT handling (per the confirmed design): the token is NEVER stored. Only its
 * sha256 (`patHash`) is persisted to prove a PAT was supplied. The raw PAT
 * travels only in the Inngest event payload — the job uses it once to fetch the
 * tree, then discards it. Public repos need no PAT (`patHash` stays null).
 */
export const connectRepo = withErrorHandling(async function connectRepo(input) {
  const user = await requireUser();
  rateLimit({ key: `github:${user.clerkUserId}`, limit: 10, windowMs: 60 * 60_000 });

  const parsed = connectRepoSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(
      parsed.error.issues?.[0]?.message ?? "Invalid repository."
    );
  }

  const fullName = parsed.data.fullName.trim();
  const pat = parsed.data.pat ? parsed.data.pat.trim() : null;
  const patHash = pat ? sha256(pat) : null;

  const repo = await db.gitHubRepo.upsert({
    where: { userId_fullName: { userId: user.id, fullName } },
    update: {
      patHash,
      analysisStatus: "pending",
      analysis: null,
      analysisError: null,
      connectedAt: new Date(),
    },
    create: {
      userId: user.id,
      fullName,
      patHash,
      analysisStatus: "pending",
    },
    select: { id: true, fullName: true, analysisStatus: true, patHash: true, isPrivate: true },
  });

  // Dispatch the background analysis. The PAT rides in the event payload
  // (ephemeral); the job uses it once then drops it. Best-effort: a dispatch
  // failure surfaces as a pending row the user can re-trigger.
  try {
    await inngest.send({
      name: "github/repo.connected",
      data: { repoId: repo.id, userId: user.id, fullName, pat },
    });
  } catch (e) {
    console.error("[NovaNest] github/repo.connected dispatch:", e?.message);
  }

  revalidatePath("/github");
  return repo;
}, "Couldn't connect that repository. Please try again.");

/** List all of the signed-in user's connected repos, newest-first. */
export const listRepos = withErrorHandling(async function listRepos() {
  const user = await requireUser();
  return db.gitHubRepo.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
}, "Couldn't load your repositories. Please try again.");

/** Get one repo + its analysis. Ownership-scoped to the signed-in user. */
export const getRepoAnalysis = withErrorHandling(async function getRepoAnalysis(id) {
  const user = await requireUser();
  const repo = await db.gitHubRepo.findFirst({ where: { id, userId: user.id } });
  if (!repo) throw new NotFoundError("Repository not found.");
  return repo;
}, "Couldn't load that analysis. Please try again.");

/** Remove a connected repo. Ownership-scoped. */
export const disconnectRepo = withErrorHandling(async function disconnectRepo(id) {
  const user = await requireUser();
  try {
    await db.gitHubRepo.delete({ where: { id, userId: user.id } });
  } catch {
    throw new NotFoundError("Repository not found or already removed.");
  }
  revalidatePath("/github");
  return { success: true };
}, "Couldn't remove that repository. Please try again.");

/**
 * Re-run the analysis for an already-connected repo. Because the PAT is never
 * stored, a private repo re-analysis requires a fresh `pat` (the job can't
 * reuse the discarded token); public repos re-analyze without one.
 */
export const reanalyzeRepo = withErrorHandling(async function reanalyzeRepo(id, pat = null) {
  const user = await requireUser();
  rateLimit({ key: `github:${user.clerkUserId}`, limit: 10, windowMs: 60 * 60_000 });

  const repo = await db.gitHubRepo.findFirst({
    where: { id, userId: user.id },
    select: { id: true, fullName: true, isPrivate: true },
  });
  if (!repo) throw new NotFoundError("Repository not found.");

  const token = pat ? pat.trim() : null;
  if (repo.isPrivate && !token) {
    throw new ValidationError(
      "This is a private repo — re-enter its access token to re-analyze (tokens aren't stored)."
    );
  }

  await db.gitHubRepo.update({
    where: { id: repo.id },
    data: {
      analysisStatus: "pending",
      analysis: null,
      analysisError: null,
      patHash: token ? sha256(token) : undefined,
      lastSyncedAt: null,
    },
  });

  try {
    await inngest.send({
      name: "github/repo.connected",
      data: { repoId: repo.id, userId: user.id, fullName: repo.fullName, pat: token },
    });
  } catch (e) {
    console.error("[NovaNest] github reanalyze dispatch:", e?.message);
  }

  revalidatePath("/github");
  return { success: true };
}, "Couldn't re-analyze that repository. Please try again.");