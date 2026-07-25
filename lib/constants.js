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