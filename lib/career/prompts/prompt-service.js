import {
  chatMemoryExtractionPrompt,
  coordinatorIntentPrompt,
  specialistAgentPrompt,
  coordinatorSynthesisPrompt,
  coachNudgePrompt,
  coachDigestPrompt,
  githubSeniorReviewPrompt,
  twinBuildPrompt,
  twinChatPrompt,
} from "@/lib/career/prompts/prompts-career-os";

const REGISTRY = {
  chatMemoryExtraction: (ctx) =>
    chatMemoryExtractionPrompt(ctx?.userText, ctx?.assistantText),

  coordinatorIntent: (ctx) => coordinatorIntentPrompt(ctx),
  coordinatorSynthesis: (ctx) => coordinatorSynthesisPrompt(ctx),

  specialistAgent: (ctx) => specialistAgentPrompt(ctx),

  coachNudge: (ctx) => coachNudgePrompt(ctx),

  coachDigest: (ctx) => coachDigestPrompt(ctx),

  githubSeniorReview: (ctx) => githubSeniorReviewPrompt(ctx),

  twinBuild: (ctx) => twinBuildPrompt(ctx),
  twinChat: (ctx) => twinChatPrompt(ctx),
};

export function buildPrompt(id, ctx) {
  const builder = REGISTRY[id];
  if (!builder) {
    throw new Error(`[PromptService] Unknown prompt id: ${id}`);
  }
  return builder(ctx ?? {});
}

export function registerPrompt(id, builder) {
  REGISTRY[id] = builder;
}

export const PROMPT_IDS = Object.keys(REGISTRY);