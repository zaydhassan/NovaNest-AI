/**
 * Coordinator (M5) — the orchestration heart of the Career OS chat.
 *
 * Flow:
 *  1. Intent classification — one generateJSON(coordinatorIntent) → {intent, agents, plan}.
 *  2. Dispatch the chosen specialist agents (Promise.all — independent). Each
 *     returns a structured finding; pure agents (memory, analytics) skip Gemini.
 *  3. Build the synthesis prompt (coordinatorSynthesis) combining agent findings
 *     + the user's recalled memory + profile, with numbered citation blocks.
 *  4. Return {intent, agentIds, agentResults, memoryBlocks, synthesisPrompt,
 *     followUps}. The CALLER streams generateTextStream(synthesisPrompt) so the
 *     reply renders tokens as they arrive (the Coordinator stays non-streaming,
 *     which keeps it testable and lets the route own the HTTP stream).
 *
 * Memory recall is done by the caller (one place, one query) and passed in so
 * both the intent classifier and the agents see the same context.
 *
 * Server-only.
 */
import { generateJSON } from "@/lib/ai/gemini";
import { buildPrompt } from "@/lib/career/prompts/prompt-service";
import { buildMemoryBlocks } from "@/lib/career/ui/citations";
import { buildChatContext } from "@/lib/career/ui/chat-context";
import { AGENTS, resolveAgentIds } from "@/lib/career/agents/index";

/**
 * @param {{ userId: string, input: string, memory?: any[], user?: any, ctx?: any, tx?: any }} args
 * @returns {Promise<{intent: string, plan: string, agentIds: string[], agentResults: any[], memoryBlocks: any[], synthesisPrompt: string, followUps: string[]}>}
 */
export async function route({ userId, input, memory = [], user = {}, ctx = {}, tx }) {
  const memorySummary =
    memory.length
      ? memory.slice(0, 8).map((m) => `- (${m.type}) ${String(m.content ?? "").slice(0, 160)}`).join("\n")
      : "(none)";

  // 1) Intent classification.
  let intent = "general";
  let plan = "";
  let requestedAgents = ["coach"];
  try {
    const classified = await generateJSON(
      buildPrompt("coordinatorIntent", { input, memorySummary })
    );
    intent = String(classified?.intent ?? "general");
    plan = String(classified?.plan ?? "");
    requestedAgents = resolveAgentIds(classified?.agents);
  } catch (error) {
    console.error("[NovaNest] coordinator intent classification failed:", error?.message);
    requestedAgents = ["coach"];
  }

  // 2) Dispatch. Build the shared context text once.
  const contextText = buildChatContext({
    user,
    memories: memory,
    agentResults: [], // agents run before synthesis; no findings yet
    extras: ctx?.extras ?? {},
  }).promptText;

  const agentCtx = {
    contextText,
    memorySummary,
    extras: ctx?.extras ?? {},
    recentMocks: ctx?.recentMocks,
    resumeSummary: ctx?.resumeSummary,
    applicationsSummary: ctx?.applicationsSummary,
    metrics: ctx?.metrics,
    goal: ctx?.goal,
    recommendedTopics: ctx?.recommendedTopics,
  };

  const agentResults = (
    await Promise.all(
      requestedAgents.map((id) =>
        AGENTS[id]
          .run({ userId, input, memory, ctx: agentCtx, tx })
          .catch((e) => ({
            agentId: id,
            summary: "(unavailable)",
            bullets: [],
            followUp: null,
            _error: e?.message,
          }))
      )
    )
  ).filter(Boolean);

  // 3) Synthesis prompt (caller streams it).
  const { blocks: memoryBlocks } = buildMemoryBlocks(memory);
  const synthesisPrompt = buildPrompt("coordinatorSynthesis", {
    input,
    user,
    memories: memory,
    agentResults,
    extras: ctx?.extras ?? {},
  });

  // 4) Collect follow-ups.
  const followUps = agentResults
    .map((r) => r?.followUp)
    .filter(Boolean)
    .slice(0, 3);

  return {
    intent,
    plan,
    agentIds: requestedAgents,
    agentResults,
    memoryBlocks,
    synthesisPrompt,
    followUps,
  };
}

export const Coordinator = { route };
export default Coordinator;