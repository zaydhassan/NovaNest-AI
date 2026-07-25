/**
 * Coach Agent (M5) — the default agent. Proactive career guidance, motivation,
 * and concrete action plans when no more-specific agent applies (or alongside
 * one). Uses the shared specialist prompt + Gemini.
 *
 * Server-only.
 */
import BaseAgent from "@/lib/career/agents/base";

class CoachAgent extends BaseAgent {
  constructor() {
    super({
      id: "coach",
      role: "AI career coach",
      capabilities: ["coaching", "career", "motivation", "planning", "general"],
      task: () =>
        `Coach the user on their career. Be warm, specific, and action-oriented.
Ground your guidance in their memory (strengths, weaknesses, goals, recent
activity). Give one concrete next step they can take today.`,
    });
  }
}

export const coachAgent = new CoachAgent();
export default coachAgent;