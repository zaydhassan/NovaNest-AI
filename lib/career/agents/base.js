/**
 * BaseAgent (M5) — the shared contract every specialist agent implements.
 *
 * A class is justified here (not just functions): all 6+ agents share the same
 * memory-recall access, prompt-build (`buildPrompt("specialistAgent", ...)`),
 * Gemini call, structured-return validation, and best-effort error isolation.
 * The Coordinator dispatches them polymorphically via the registry in
 * `./index.js`.
 *
 * All AI calls go through `lib/ai/gemini.js` (single entrypoint).
 *
 * Server-only.
 */
import { generateJSON } from "@/lib/ai/gemini";
import { buildPrompt } from "@/lib/career/prompts/prompt-service";

/**
 * @typedef {Object} AgentResult
 * @property {string} agentId
 * @property {string} summary
 * @property {string[]} bullets
 * @property {Array<{type: string, content: string, tags?: string[], importance?: number}>} [suggestedMemories]
 * @property {string|null} [followUp]
 */

export class BaseAgent {
  /** @param {{ id: string, role: string, capabilities?: string[], task?: (ctx:any)=>string }} opts */
  constructor({ id, role, capabilities = [], task }) {
    this.id = id;
    this.role = role;
    this.capabilities = capabilities;
    this.task = task; // optional ctx → task-string override
  }

  /**
   * Default task description; agents override.
   * @returns {string}
   */
  describeTask(/* ctx */) {
    return "Help the user with their question, grounded in their career history.";
  }

  /**
   * Run the agent. Calls the shared specialist prompt + Gemini, validates the
   * structured return, and never throws — a failure returns a minimal
   * "unavailable" result so the Coordinator can still synthesize a reply from
   * the other agents.
   *
   * @param {{ userId: string, input: string, memory?: any[], ctx?: any, tx?: any }} args
   * @returns {Promise<AgentResult>}
   */
  async run({ userId, input, memory = [], ctx = {} }) {
    const task = this.task ? this.task(ctx) : this.describeTask(ctx);
    try {
      const prompt = buildPrompt("specialistAgent", {
        agentId: this.id,
        role: this.role,
        task,
        context: ctx?.contextText ?? "",
        memory: ctx?.memorySummary ?? "",
        input,
      });
      const parsed = await generateJSON(prompt);
      return this.normalize({ userId, parsed, memory });
    } catch (error) {
      console.error(`[NovaNest] agent ${this.id} failed:`, error?.message);
      return {
        agentId: this.id,
        summary: `(unavailable)`,
        bullets: [],
        followUp: null,
      };
    }
  }

  /**
   * Validate + normalize the model's JSON into the AgentResult shape.
   * Subclasses can override to inject agent-specific suggested memories.
   */
  normalize({ parsed = {} }) {
    const bullets = Array.isArray(parsed?.bullets)
      ? parsed.bullets.map((b) => String(b)).filter(Boolean).slice(0, 8)
      : [];
    return {
      agentId: this.id,
      summary: String(parsed?.summary ?? "").slice(0, 500) || this.role,
      bullets,
      followUp: parsed?.followUp ? String(parsed.followUp).slice(0, 300) : null,
      suggestedMemories: [],
      _raw: parsed,
    };
  }
}

export default BaseAgent;