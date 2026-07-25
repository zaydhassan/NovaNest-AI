/**
 * GitHub Agent (M7) — produces a Senior-Engineer 6-section repository review.
 *
 * Unlike the chat specialists (which use the shared `specialistAgent` prompt),
 * this agent overrides `run` to call the dedicated `githubSeniorReview` prompt
 * and return the structured review JSON the /github page renders. Called by
 * the Inngest `analyze-github-repo` job, not the Coordinator chat router.
 *
 * Never throws — a failure returns a minimal "unavailable" result so the job
 * can mark the repo `failed` and the UI can show the error.
 *
 * Server-only.
 */
import { generateJSON } from "@/lib/ai/gemini";
import { buildPrompt } from "@/lib/career/prompts/prompt-service";
import BaseAgent from "@/lib/career/agents/base";

class GitHubAgent extends BaseAgent {
  constructor() {
    super({
      id: "github",
      role: "senior staff engineer",
      capabilities: ["github", "architecture", "security", "performance", "testing", "scalability"],
      task: (ctx) =>
        `Review the ${ctx?.fullName ?? "repository"} as a senior staff engineer.`,
    });
  }

  /**
   * @param {{ userId?: string, input?: string, ctx?: any }} args
   *   ctx carries the fetched repo payload (fullName, description, language,
   *   defaultBranch, tree, readme, files).
   * @returns {Promise<{agentId:string, review:any|null, error?:string}>}
   */
  async run({ ctx = {} } = {}) {
    try {
      const prompt = buildPrompt("githubSeniorReview", ctx ?? {});
      const review = await generateJSON(prompt);
      return {
        agentId: this.id,
        review: this.normalize(review),
      };
    } catch (error) {
      console.error(`[NovaNest] agent ${this.id} failed:`, error?.message);
      return {
        agentId: this.id,
        review: null,
        error: error?.message ?? "GitHub analysis failed.",
      };
    }
  }

  /** Coerce the model's JSON into the 6-section shape with sane defaults. */
  normalize(raw = {}) {
    const sections = raw?.sections && typeof raw.sections === "object" ? raw.sections : {};
    const out = {};
    for (const key of [
      "architecture",
      "security",
      "performance",
      "documentation",
      "testing",
      "scalability",
    ]) {
      const s = sections[key] && typeof sections[key] === "object" ? sections[key] : {};
      out[key] = {
        score: Math.max(0, Math.min(100, Math.round(Number(s.score ?? 0)))),
        notes: Array.isArray(s.notes) ? s.notes.map(String).slice(0, 5) : [],
        suggestions: Array.isArray(s.suggestions)
          ? s.suggestions.map(String).slice(0, 5)
          : [],
      };
    }
    return {
      summary: String(raw?.summary ?? "").slice(0, 600),
      grade: ["A", "B", "C", "D"].includes(raw?.grade) ? raw.grade : "B",
      sections: out,
      highlights: Array.isArray(raw?.highlights)
        ? raw.highlights.map(String).slice(0, 4)
        : [],
      redFlags: Array.isArray(raw?.redFlags) ? raw.redFlags.map(String).slice(0, 3) : [],
      interviewTalkingPoints: Array.isArray(raw?.interviewTalkingPoints)
        ? raw.interviewTalkingPoints.map(String).slice(0, 5)
        : [],
    };
  }
}

export const githubAgent = new GitHubAgent();
export default githubAgent;