
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

export { parseFeedback, backfillMockInterviews } from "@/lib/career/memory/interview-memory";

export { buildPrompt, registerPrompt, PROMPT_IDS } from "@/lib/career/prompts/prompt-service";

export {
  tokenize,
  scoreMemory,
  keywordScore,
  typeScore,
  recencyScore,
  cosine,
  clamp01,
} from "@/lib/career/memory/relevance";

export {
  recordTimelineEvent,
  listTimeline,
  backfillTimeline,
} from "@/lib/career/timeline/timeline-engine";

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

export {
  computeHealthScore,
  learningPillar,
  memoryPillar,
  CAREER_HEALTH_LEVELS,
} from "@/lib/career/career/career-engine";
export { computeInterviewReadiness, READINESS_LEVELS } from "@/lib/career/career/readiness";
export { computeSkillGrowth } from "@/lib/career/career/skill-growth";

export { computeIntelligence } from "@/lib/career/intelligence/intelligence-engine";

export { computeInterviewTrends } from "@/lib/career/analytics/interview-trends";
export { getInterviewTrendsData } from "@/lib/career/analytics/analytics-service";

export { fetchRepoPayload } from "@/lib/career/github/github-fetcher";
export { githubAgent } from "@/lib/career/agents/github.agent";
export { EMBEDDINGS_ENABLED, embed, cosine as embedCosine } from "@/lib/career/embeddings/embedding-service";

export { gatherTwinSources, buildTwinProfile } from "@/lib/career/twin/twin-builder";

export { recommendNextTopics } from "@/lib/career/recommendations/next-topics";
export { getRecommendedTopics } from "@/lib/career/recommendations/recommendation-service";

export { buildMemoryBlocks, parseCitations, stripCitations } from "@/lib/career/ui/citations";
export {
  buildChatContext,
  buildUserProfile,
  summarizeMemory,
  buildAgentDigest,
} from "@/lib/career/ui/chat-context";

export { Coordinator, route } from "@/lib/career/agents/coordinator";
export {
  AGENTS,
  AGENT_IDS,
  getAgent,
  resolveAgentIds,
} from "@/lib/career/agents/index";