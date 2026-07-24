"use server";

import { db } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { generateJSON } from "@/lib/ai/gemini";
import { atsMatchPrompt } from "@/lib/ai/prompts";
import { rateLimit } from "@/lib/rate-limit";
import { applicationSchema } from "@/lib/schemas";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { bumpActivity } from "@/lib/gamify";
import { createNotification } from "@/lib/notifications";
import { APPLICATION_STATUSES } from "@/lib/constants";
import { revalidatePath } from "next/cache";

/**
 * Notification copy + type for an application status move. REJECTED is branched
 * out explicitly because it sits AFTER OFFER in APPLICATION_STATUSES (highest
 * orderIndex), so the generic "advanced" check would otherwise mislabel a
 * rejection as progress.
 */
function applicationStatusNotification(userId, company, status) {
  if (status === "REJECTED") {
    return createNotification(userId, {
      type: "application_rejected",
      title: `${company} — not selected this time`,
      body: "Stay consistent — your next application is already in the pipeline.",
      href: "/applications",
      data: { company, status },
    });
  }
  return createNotification(userId, {
    type: "application_advanced",
    title: `${company} moved to ${status.charAt(0) + status.slice(1).toLowerCase()}`,
    body: "Great progress — keep the momentum going.",
    href: "/applications",
    data: { company, status },
  });
}

/**
 * List all of the signed-in user's applications, newest first.
 * Includes their linked resume id (for ATS matching) — fetched separately on
 * demand to keep this query light.
 */
export async function getApplications() {
  const user = await requireUser();
  return db.application.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getApplication(id) {
  const user = await requireUser();
  const app = await db.application.findFirst({
    where: { id, userId: user.id },
  });
  if (!app) throw new NotFoundError("Application not found.");
  return app;
}

export async function createApplication(data) {
  const user = await requireUser();

  const parsed = applicationSchema.safeParse(data);
  if (!parsed.success) {
    throw new ValidationError(
      parsed.error.issues?.[0]?.message ?? "Invalid application data."
    );
  }

  const status = parsed.data.status || "SAVED";
  const created = await db.application.create({
    data: {
      userId: user.id,
      company: parsed.data.company,
      role: parsed.data.role,
      location: parsed.data.location || null,
      salary: parsed.data.salary || null,
      jobUrl: parsed.data.jobUrl || null,
      jobDescription: parsed.data.jobDescription || null,
      status,
      notes: parsed.data.notes || null,
      appliedAt:
        status !== "SAVED" ? new Date() : parsed.data.jobUrl ? null : null,
    },
  });

  bumpActivity(user.id, "application_logged").catch((e) =>
    console.error("[NovaNest] bumpActivity application_logged:", e?.message)
  );
  createNotification(user.id, {
    type: "application_logged",
    title: `Application tracked at ${created.company}`,
    body: `${created.role} — added to your pipeline. Add a JD to score ATS match.`,
    href: "/applications",
    data: { company: created.company, role: created.role, status },
  }).catch((e) => console.error("[NovaNest] application_logged notify:", e?.message));
  revalidatePath("/applications");
  revalidatePath("/dashboard");
  return created;
}

export async function updateApplication(id, data) {
  const user = await requireUser();
  const existing = await db.application.findFirst({
    where: { id, userId: user.id },
    select: { id: true, status: true },
  });
  if (!existing) throw new NotFoundError("Application not found.");

  const parsed = applicationSchema.safeParse(data);
  if (!parsed.success) {
    throw new ValidationError(
      parsed.error.issues?.[0]?.message ?? "Invalid application data."
    );
  }

  const advancedTowardOffer = orderIndex(parsed.data.status) > orderIndex(existing.status);

  const updated = await db.application.update({
    where: { id },
    data: {
      company: parsed.data.company,
      role: parsed.data.role,
      location: parsed.data.location || null,
      salary: parsed.data.salary || null,
      jobUrl: parsed.data.jobUrl || null,
      jobDescription: parsed.data.jobDescription || null,
      status: parsed.data.status,
      notes: parsed.data.notes || null,
      appliedAt:
        parsed.data.status !== "SAVED" && !existing.appliedAt ? new Date() : undefined,
    },
  });

  if (advancedTowardOffer) {
    bumpActivity(user.id, "application_advanced").catch(() => {});
    applicationStatusNotification(user.id, updated.company, parsed.data.status).catch((e) =>
      console.error("[NovaNest] application status notify:", e?.message)
    );
  }
  revalidatePath("/applications");
  revalidatePath("/dashboard");
  return updated;
}

export async function updateApplicationStatus(id, status) {
  const user = await requireUser();
  const existing = await db.application.findFirst({
    where: { id, userId: user.id },
    select: { id: true, status: true },
  });
  if (!existing) throw new NotFoundError("Application not found.");
  if (!APPLICATION_STATUSES.includes(status)) {
    throw new ValidationError("Invalid status.");
  }

  const updated = await db.application.update({
    where: { id },
    data: {
      status,
      appliedAt: status !== "SAVED" && !existing.appliedAt ? new Date() : undefined,
    },
  });

  if (orderIndex(status) > orderIndex(existing.status)) {
    bumpActivity(user.id, "application_advanced").catch(() => {});
    applicationStatusNotification(user.id, updated.company, status).catch((e) =>
      console.error("[NovaNest] application status notify:", e?.message)
    );
  }
  revalidatePath("/applications");
  revalidatePath("/dashboard");
  return updated;
}

export async function deleteApplication(id) {
  const user = await requireUser();
  try {
    await db.application.delete({ where: { id, userId: user.id } });
  } catch {
    throw new NotFoundError("Application not found or already deleted.");
  }
  revalidatePath("/applications");
  revalidatePath("/dashboard");
  return { success: true };
}

/**
 * ATS-match a stored application's JD against the user's saved resume.
 * Persists the score + structured feedback on the application row.
 */
export async function scoreApplicationAts(id) {
  const user = await requireUser();
  rateLimit({
    key: `ats:${user.clerkUserId}`,
    limit: 15,
    windowMs: 10 * 60_000,
  });

  const app = await db.application.findFirst({
    where: { id, userId: user.id },
  });
  if (!app) throw new NotFoundError("Application not found.");
  if (!app.jobDescription) {
    throw new ValidationError("Add a job description to this application first.");
  }

  const resume = await db.resume.findUnique({ where: { userId: user.id } });
  if (!resume?.content) {
    throw new ValidationError("Save a resume first, then we can score it against the JD.");
  }

  const result = await generateJSON(atsMatchPrompt(resume.content, app.jobDescription));

  const updated = await db.application.update({
    where: { id },
    data: {
      atsScore: Number(result?.score ?? 0),
      atsFeedback: JSON.stringify(result ?? {}),
    },
  });

  createNotification(user.id, {
    type: "ats_score",
    title: `ATS match for ${app.company}: ${Math.round(Number(result?.score ?? 0))}%`,
    body: "See matched and missing keywords, then tweak your resume to close the gap.",
    href: "/applications",
    data: { company: app.company, score: Number(result?.score ?? 0) },
  }).catch((e) => console.error("[NovaNest] ats notify:", e?.message));

  revalidatePath("/applications");
  return { ...updated, atsResult: result };
}

function orderIndex(status) {
  return APPLICATION_STATUSES.indexOf(status);
}