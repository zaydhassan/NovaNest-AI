import { generateJSON } from "@/lib/ai/gemini";
import { buildPrompt } from "@/lib/career/prompts/prompt-service";


export class BaseAgent {
  constructor({ id, role, capabilities = [], task }) {
    this.id = id;
    this.role = role;
    this.capabilities = capabilities;
    this.task = task;
  }

  describeTask() {
    return "Help the user with their question, grounded in their career history.";
  }

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