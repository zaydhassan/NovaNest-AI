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
import { fromApplication } from "@/lib/career/memory/memory-extractors";
import { recordTimelineEvent } from "@/lib/career/timeline/timeline-engine";
import { deriveFromApplication } from "@/lib/career/timeline/timeline-derivers";
import { applicationAgent } from "@/lib/career/agents/application.agent";
import { recallMemory } from "@/lib/career/memory/memory-service";
import { summarizeMemory } from "@/lib/career/ui/chat-context";
import { revalidatePath } from "next/cache";

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
      resumeId: parsed.data.resumeId || null,
      coverLetterId: parsed.data.coverLetterId || null,
      rejectionReason: parsed.data.rejectionReason || null,
      offerDetails: parsed.data.offerDetails || null,
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

  fromApplication(user.id, created).catch((e) =>
    console.error("[NovaNest] fromApplication memory:", e?.message)
  );

  recordTimelineEvent({ userId: user.id, ...deriveFromApplication(created) }).catch((e) =>
    console.error("[NovaNest] timeline application:", e?.message)
  );

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
      resumeId: parsed.data.resumeId || null,
      coverLetterId: parsed.data.coverLetterId || null,
      rejectionReason: parsed.data.rejectionReason || null,
      offerDetails: parsed.data.offerDetails || null,
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

  if (status !== existing.status) {
    recordTimelineEvent({ userId: user.id, ...deriveFromApplication(updated) }).catch((e) =>
      console.error("[NovaNest] timeline application status:", e?.message)
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

export async function linkApplicationArtifacts(id, { resumeId, coverLetterId } = {}) {
  const user = await requireUser();
  const app = await db.application.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });
  if (!app) throw new NotFoundError("Application not found.");

  const nextResumeId = resumeId ? String(resumeId) : null;
  const nextCoverId = coverLetterId ? String(coverLetterId) : null;

  if (nextResumeId) {
    const owned = await db.resume.findUnique({
      where: { id: nextResumeId },
      select: { userId: true },
    });
    if (!owned || owned.userId !== user.id) {
      throw new ValidationError("That resume doesn't belong to your account.");
    }
  }
  if (nextCoverId) {
    const owned = await db.coverLetter.findFirst({
      where: { id: nextCoverId, userId: user.id },
      select: { id: true },
    });
    if (!owned) {
      throw new ValidationError("That cover letter doesn't belong to your account.");
    }
  }

  const updated = await db.application.update({
    where: { id },
    data: { resumeId: nextResumeId, coverLetterId: nextCoverId },
  });

  revalidatePath("/applications");
  revalidatePath(`/applications/${id}`);
  return updated;
}

export async function getApplicationRecommendations(id) {
  const user = await requireUser({ select: { id: true } });

  const app = await db.application.findFirst({
    where: { id, userId: user.id },
  });
  if (!app) throw new NotFoundError("Application not found.");

  const memory = await recallMemory({
    userId: user.id,
    query: `${app.company} ${app.role} ${app.status}`,
    limit: 8,
  });

  const resumeMeta = app.resumeId
    ? await db.resume.findUnique({
        where: { id: app.resumeId },
        select: { id: true, atsScore: true, feedback: true },
      })
    : null;

  let atsSummary = null;
  if (app.atsFeedback) {
    try {
      atsSummary = JSON.parse(app.atsFeedback);
    } catch {
      atsSummary = null;
    }
  }

  const ctx = {
    input: `Help me with my ${app.role} application at ${app.company} (status: ${app.status}).`,
    applicationsSummary: `${app.company} — ${app.role} (${app.status})`,
    company: app.company,
    role: app.role,
    status: app.status,
    jobDescription: app.jobDescription,
    atsScore: app.atsScore,
    atsSummary,
    resumeAtsScore: resumeMeta?.atsScore ?? null,
    rejectionReason: app.rejectionReason,
    offerDetails: app.offerDetails,
    notes: app.notes,
    contextText: [
      `APPLICATION: ${app.company} — ${app.role} (status: ${app.status})`,
      app.location ? `Location: ${app.location}` : null,
      app.salary ? `Salary band: ${app.salary}` : null,
      app.atsScore != null ? `Resume ATS match: ${Math.round(Number(app.atsScore))}%` : null,
      atsSummary?.missingKeywords?.length
        ? `Missing JD keywords: ${atsSummary.missingKeywords.join(", ")}`
        : null,
      atsSummary?.recommendations?.length
        ? `ATS edit suggestions: ${atsSummary.recommendations.join(" | ")}`
        : null,
      app.rejectionReason ? `Prior rejection reason: ${app.rejectionReason}` : null,
      app.offerDetails ? `Offer details: ${JSON.stringify(app.offerDetails)}` : null,
      app.notes ? `Notes: ${app.notes}` : null,
      app.jobDescription
        ? `Job description excerpt: ${String(app.jobDescription).slice(0, 1200)}`
        : null,
    ]
      .filter(Boolean)
      .join("\n"),
    memorySummary: summarizeMemory(memory),
  };

  const result = await applicationAgent.run({
    userId: user.id,
    input: ctx.input,
    memory,
    ctx,
  });

  return { application: app, recommendations: result, memories: memory };
}