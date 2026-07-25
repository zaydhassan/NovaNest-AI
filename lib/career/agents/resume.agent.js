/**
 * Resume Agent (M5) — resume tweaks, ATS optimization, and section rewrites
 * targeted at a specific role. Uses the shared specialist prompt + Gemini,
 * grounded in the user's saved resume (passed via ctx).
 *
 * Server-only.
 */
import BaseAgent from "@/lib/career/agents/base";

class ResumeAgent extends BaseAgent {
  constructor() {
    super({
      id: "resume",
      role: "resume + ATS strategist",
      capabilities: ["resume", "cv", "ats", "rewrite", "cover-letter"],
      task: (ctx) =>
        `Help the user improve their resume for their target role. ${
          ctx?.resumeSummary
            ? `Their current resume (excerpt): ${ctx.resumeSummary}.`
            : "They have no saved resume yet — recommend they build one at /resume and offer the highest-leverage sections to start with."
        }`,
    });
  }
}

export const resumeAgent = new ResumeAgent();
export default resumeAgent;