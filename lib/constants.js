/**
 * Shared non-action constants. Kept out of the `"use server"` action files
 * because Next.js forbids exporting anything but async functions from a
 * Server Action module.
 */

export const APPLICATION_STATUSES = [
  "SAVED",
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
];

// ── Career OS ─────────────────────────────────────────────────────
// Enum-like string sets mirrored here (no Prisma enums — plain String columns
// + these arrays for validation/display), following the APPLICATION_STATUSES
// pattern. Each is the source of truth for its column's allowed values.

// MemoryEntry.type — the structured long-term-memory categories.
export const MEMORY_TYPES = [
  "identity",
  "career",
  "interview",
  "application",
  "learning",
  "project",
  "github",
  "preference",
  "skill",
  "achievement",
];

// TimelineEvent.type — the auto-generated career-timeline categories.
export const TIMELINE_TYPES = [
  "learning",
  "building",
  "applying",
  "interviewing",
  "offer",
  "rejection",
  "achievement",
  "coach",
  "github",
  "milestone",
];

// CoachInsight.kind / CoachInsight.severity.
export const COACH_INSIGHT_KINDS = [
  "nudge",
  "progress",
  "risk",
  "recommendation",
  "celebration",
];
export const COACH_SEVERITIES = ["info", "warn", "good", "critical"];

// LearningTopic.status (M9) — declared here so M1 schemas can reference it.
export const LEARNING_TOPIC_STATUSES = [
  "todo",
  "learning",
  "learned",
  "needs_review",
];

// GitHubRepo.analysisStatus (M7).
export const GITHUB_ANALYSIS_STATUS = [
  "pending",
  "running",
  "complete",
  "failed",
];

// CareerGoal.status (M9).
export const GOAL_STATUSES = ["active", "achieved", "retired"];

// ChatMessage.role.
export const SESSION_ROLES = ["user", "assistant", "system"];

// MemoryEntry.source — where a memory was learned from.
export const MEMORY_SOURCES = [
  "chat",
  "interview",
  "resume",
  "application",
  "github",
  "quiz",
  "mock",
  "onboarding",
  "manual",
  "coach",
];

// TimelineEvent.sourceType — the originating data type for a derived event.
export const TIMELINE_SOURCE_TYPES = [
  "resume",
  "application",
  "mockInterview",
  "assessment",
  "chat",
  "github",
  "learning",
  "memory",
  "manual",
];

// ── Memory Engine — structured memory ──────────────────────────────
// StructuredMemory.category — the discrete, curated career artifacts that
// don't have a dedicated model. Goals/Applications/Interview Results/Learning
// Progress already have dedicated models and are retrieved directly by the
// intent router (not duplicated into StructuredMemory).
export const STRUCTURED_MEMORY_CATEGORIES = [
  "project",
  "skill",
  "achievement",
  "certificate",
  "preference",
  "resume_version",
  "lesson", // previous mistakes / takeaways
  "note",
];

// Retrieval intents — how a user query is routed to structured sources.
export const STRUCTURED_MEMORY_INTENTS = [
  "interview",
  "application",
  "resume",
  "learning",
  "goal",
  "general",
];

// StructuredMemory.linkedType — the dedicated model a structured memory is
// derived from (for dedupe across sources).
export const STRUCTURED_MEMORY_LINK_TYPES = [
  "resume",
  "mockInterview",
  "assessment",
  "application",
  "learningTopic",
  "goal",
];

// StructuredMemory.source — where a structured memory was captured from.
export const STRUCTURED_MEMORY_SOURCES = [
  "manual",
  "ai-extracted",
  "import",
  "resume",
  "mock",
  "interview",
  "quiz",
  "application",
  "coach",
];

// ── Dream Company Mode ─────────────────────────────────────────────
// The 8 dream companies a user can target. `slug` is the validated value
// stored on User.targetCompany (and CompanyProfile.company); `name` is the
// display label; `tagline` is the one-line flavor shown in the picker.
export const DREAM_COMPANIES = [
  { name: "Google", slug: "google", tagline: "Scale, systems, and ambiguity" },
  { name: "OpenAI", slug: "openai", tagline: "Frontier ML and research" },
  { name: "Microsoft", slug: "microsoft", tagline: "Enterprise and platform" },
  { name: "Amazon", slug: "amazon", tagline: "Customer obsession and scale" },
  { name: "Meta", slug: "meta", tagline: "Social scale and ML" },
  { name: "Netflix", slug: "netflix", tagline: "Freedom and responsibility" },
  { name: "Adobe", slug: "adobe", tagline: "Creative tools and DX" },
  { name: "NVIDIA", slug: "nvidia", tagline: "Accelerated computing and AI" },
];

// Just the slugs — used as the Zod enum domain (targetCompanySchema).
export const DREAM_COMPANY_SLUGS = DREAM_COMPANIES.map((c) => c.slug);

// Slug → display name lookup (avoids a linear scan at call sites).
export const DREAM_COMPANY_BY_SLUG = Object.fromEntries(
  DREAM_COMPANIES.map((c) => [c.slug, c])
);