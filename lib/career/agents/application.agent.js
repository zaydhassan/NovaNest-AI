/**
 * Application Agent (M5) — application strategy, role/company match, and next
 * steps for a specific application (e.g. "I have an interview at Amazon").
 * Uses the shared specialist prompt + Gemini, grounded in the user's tracked
 * applications (passed via ctx).
 *
 * Server-only.
 */
import BaseAgent from "@/lib/career/agents/base";

class ApplicationAgent extends BaseAgent {
  constructor() {
    super({
      id: "application",
      role: "application + pipeline strategist",
      capabilities: ["application", "company", "role", "pipeline", "offer", "negotiation"],
      task: (ctx) =>
        `Help the user with an application. ${
          ctx?.applicationsSummary
            ? `Their tracked applications: ${ctx.applicationsSummary}.`
            : "They have no tracked applications yet — recommend they add one at /applications."
        } If they name a company, reference whether they have an application to that company.`,
    });
  }
}

export const applicationAgent = new ApplicationAgent();
export default applicationAgent;