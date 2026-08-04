
export const APPLICATION_STATUSES = [
  "SAVED",
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
];


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

export const COACH_INSIGHT_KINDS = [
  "nudge",
  "progress",
  "risk",
  "recommendation",
  "celebration",
];
export const COACH_SEVERITIES = ["info", "warn", "good", "critical"];

export const LEARNING_TOPIC_STATUSES = [
  "todo",
  "learning",
  "learned",
  "needs_review",
];

export const GITHUB_ANALYSIS_STATUS = [
  "pending",
  "running",
  "complete",
  "failed",
];

export const GOAL_STATUSES = ["active", "achieved", "retired"];

export const SESSION_ROLES = ["user", "assistant", "system"];

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

export const STRUCTURED_MEMORY_CATEGORIES = [
  "project",
  "skill",
  "achievement",
  "certificate",
  "preference",
  "resume_version",
  "lesson",
  "note",
];

export const STRUCTURED_MEMORY_INTENTS = [
  "interview",
  "application",
  "resume",
  "learning",
  "goal",
  "general",
];

export const STRUCTURED_MEMORY_LINK_TYPES = [
  "resume",
  "mockInterview",
  "assessment",
  "application",
  "learningTopic",
  "goal",
];

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

export const DREAM_COMPANY_SLUGS = DREAM_COMPANIES.map((c) => c.slug);

export const DREAM_COMPANY_BY_SLUG = Object.fromEntries(
  DREAM_COMPANIES.map((c) => [c.slug, c])
);