/**
 * lib/career — the Career OS service + agent layer.
 *
 * Public API surface for the memory + timeline primitives (M1). Later modules
 * add agents, career engine, analytics, recommendations, prompts, embeddings.
 *
 * Server-only. Import from `@/lib/career` in server actions and Inngest
 * functions — do NOT import these into client components (they touch the DB).
 */

// Memory — long-term structured memory (create/recall/forget/list/extract).
export {
  createMemory,
  recallMemory,
  forgetMemory,
  unforgetMemory,
  deleteMemory,
  listMemory,
  memoryStats,
  extractAndWrite,
} from "@/lib/career/memory/memory-service";

// Memory extractors — per-source auto-extraction (fromChat/fromMock/fromResume/...).
export {
  fromResume,
  fromApplication,
  fromMock,
  fromQuiz,
  fromOnboarding,
  fromChat,
  fromGitHub,
  fromLearning,
  fromGoal,
} from "@/lib/career/memory/memory-extractors";

// Interview memory — typed feedback accessor + denormalized-column backfill (M3).
export { parseFeedback, backfillMockInterviews } from "@/lib/career/memory/interview-memory";

// Prompt Service — registry of Career OS prompt builders.
export { buildPrompt, registerPrompt, PROMPT_IDS } from "@/lib/career/prompts/prompt-service";

// Relevance scoring (pure) — agents that re-rank a memory slice can use these.
export {
  tokenize,
  scoreMemory,
  keywordScore,
  typeScore,
  recencyScore,
  cosine,
  clamp01,
} from "@/lib/career/memory/relevance";

// Timeline — auto-generated career timeline (record/list/backfill).
export {
  recordTimelineEvent,
  listTimeline,
  backfillTimeline,
} from "@/lib/career/timeline/timeline-engine";

// Timeline derivers (pure) — turn existing rows into TimelineEvent specs.
export {
  deriveFromResume,
  deriveFromApplication,
  deriveFromMock,
  deriveFromAssessment,
  deriveFromCoverLetter,
  deriveFromGitHub,
  deriveFromLearningSession,
  deriveAllForUser,
} from "@/lib/career/timeline/timeline-derivers";

// Career engine — Career Health Score (extends NovaScore), readiness, growth.
export {
  computeHealthScore,
  learningPillar,
  memoryPillar,
  CAREER_HEALTH_LEVELS,
} from "@/lib/career/career/career-engine";
export { computeInterviewReadiness, READINESS_LEVELS } from "@/lib/career/career/readiness";
export { computeSkillGrowth } from "@/lib/career/career/skill-growth";

// Analytics (M6) — interview trend computation + aggregate analytics helper.
export { computeInterviewTrends } from "@/lib/career/analytics/interview-trends";
export { getInterviewTrendsData } from "@/lib/career/analytics/analytics-service";

// GitHub Project Analyzer (M7) — fetcher + agent + embeddings.
export { fetchRepoPayload } from "@/lib/career/github/github-fetcher";
export { githubAgent } from "@/lib/career/agents/github.agent";
export { EMBEDDINGS_ENABLED, embed, cosine as embedCosine } from "@/lib/career/embeddings/embedding-service";

// AI Career Twin (M8) — source gatherer + profile builder.
export { gatherTwinSources, buildTwinProfile } from "@/lib/career/twin/twin-builder";

// Learning Engine (M9) — next-topics recommendation (pure) + service gatherer.
export { recommendNextTopics } from "@/lib/career/recommendations/next-topics";
export { getRecommendedTopics } from "@/lib/career/recommendations/recommendation-service";

// Chat UI helpers (pure + isomorphic) — citation parsing + context building.
export { buildMemoryBlocks, parseCitations, stripCitations } from "@/lib/career/ui/citations";
export {
  buildChatContext,
  buildUserProfile,
  summarizeMemory,
  buildAgentDigest,
} from "@/lib/career/ui/chat-context";

// Agents (M5) — Coordinator + registry + specialist agent instances.
export { Coordinator, route } from "@/lib/career/agents/coordinator";
export {
  AGENTS,
  AGENT_IDS,
  getAgent,
  resolveAgentIds,
} from "@/lib/career/agents/index";