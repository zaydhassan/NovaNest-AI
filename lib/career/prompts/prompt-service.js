/**
 * Prompt Service — registry of Career OS prompt builders.
 *
 * Agents and memory extractors ask for a prompt by id (`buildPrompt(id, ctx)`)
 * instead of importing a specific builder, so the prompt contract stays in
 * one place and the same builder can be reused by a server action and an
 * Inngest job. M2 registered the memory-extraction prompt; M5 adds the
 * coordinator + agent prompts to this same registry.
 *
 * Pure: no IO, no Gemini calls — just string composition.
 */
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

/** @type {Record<string, (ctx: any) => string>} */
const REGISTRY = {
  // Memory extraction — see memory-extractors.js fromChat.
  chatMemoryExtraction: (ctx) =>
    chatMemoryExtractionPrompt(ctx?.userText, ctx?.assistantText),

  // Coordinator (M5) — intent routing + final streamed synthesis.
  coordinatorIntent: (ctx) => coordinatorIntentPrompt(ctx),
  coordinatorSynthesis: (ctx) => coordinatorSynthesisPrompt(ctx),

  // Specialist agents (M5) — shared shape; each agent sets its own task/role.
  specialistAgent: (ctx) => specialistAgentPrompt(ctx),

  // Coach proactive nudges (M5 nudgeNow / M10 weekly digest).
  coachNudge: (ctx) => coachNudgePrompt(ctx),

  // Coach weekly digest (M10) — 3-5 insights from the past week's activity.
  coachDigest: (ctx) => coachDigestPrompt(ctx),

  // GitHub Project Analyzer (M7) — Senior-Engineer 6-section review.
  githubSeniorReview: (ctx) => githubSeniorReviewPrompt(ctx),

  // AI Career Twin (M8) — build profile + chat-in-voice.
  twinBuild: (ctx) => twinBuildPrompt(ctx),
  twinChat: (ctx) => twinChatPrompt(ctx),
};

/**
 * Build a prompt by id.
 * @param {string} id - registered prompt id
 * @param {any} [ctx] - builder context
 * @returns {string} the prompt string
 * @throws if the id is unknown
 */
export function buildPrompt(id, ctx) {
  const builder = REGISTRY[id];
  if (!builder) {
    throw new Error(`[PromptService] Unknown prompt id: ${id}`);
  }
  return builder(ctx ?? {});
}

/** Register a prompt at runtime (used by later modules to extend the registry). */
export function registerPrompt(id, builder) {
  REGISTRY[id] = builder;
}

export const PROMPT_IDS = Object.keys(REGISTRY);