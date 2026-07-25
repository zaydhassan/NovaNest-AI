/**
 * Interview Agent (M5) — mock-interview prep, likely questions, weakness
 * drilling, and debriefs. Uses the shared specialist prompt + Gemini.
 * Grounds advice in the user's recent mocks (passed via ctx) and recalled
 * memory.
 *
 * Server-only.
 */
import BaseAgent from "@/lib/career/agents/base";

class InterviewAgent extends BaseAgent {
  constructor() {
    super({
      id: "interview",
      role: "interview preparation coach",
      capabilities: ["interview", "mock", "behavioral", "technical", "questions"],
      task: (ctx) =>
        `The user is preparing for an interview. Use their recent mock interview
history (in the context) to identify weak areas and give targeted, specific
prep. ${
          ctx?.recentMocks
            ? `Recent mocks: ${ctx.recentMocks}.`
            : "No mock history yet — recommend they run one first."
        }`,
    });
  }
}

export const interviewAgent = new InterviewAgent();
export default interviewAgent;