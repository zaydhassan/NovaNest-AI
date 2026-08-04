import { generateJSON } from "@/lib/ai/gemini";
import { buildPrompt } from "@/lib/career/prompts/prompt-service";
import { buildMemoryBlocks } from "@/lib/career/ui/citations";
import { buildChatContext } from "@/lib/career/ui/chat-context";
import { AGENTS, resolveAgentIds } from "@/lib/career/agents/index";

export async function route({ userId, input, memory = [], user = {}, ctx = {}, tx }) {
  const memorySummary =
    memory.length
      ? memory.slice(0, 8).map((m) => `- (${m.type}) ${String(m.content ?? "").slice(0, 160)}`).join("\n")
      : "(none)";

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

  const contextText = buildChatContext({
    user,
    memories: memory,
    agentResults: [],
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

  const { blocks: memoryBlocks } = buildMemoryBlocks(memory);
  const synthesisPrompt = buildPrompt("coordinatorSynthesis", {
    input,
    user,
    memories: memory,
    agentResults,
    extras: ctx?.extras ?? {},
  });

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