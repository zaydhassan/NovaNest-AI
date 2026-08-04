import BaseAgent from "@/lib/career/agents/base";

class MemoryAgent extends BaseAgent {
  constructor() {
    super({
      id: "memory",
      role: "long-term memory recall",
      capabilities: ["recall", "remember"],
    });
  }

  async run({ memory = [] } = {}) {
    if (!memory.length) {
      return {
        agentId: this.id,
        summary: "No relevant memories recalled for this message.",
        bullets: [],
        followUp: null,
      };
    }

    const byType = new Map();
    for (const m of memory) {
      const t = m.type ?? "note";
      if (!byType.has(t)) byType.set(t, []);
      byType.get(t).push(m);
    }

    const bullets = [];
    for (const [type, items] of byType) {
      const top = items
        .slice(0, 3)
        .map((m) => String(m.content ?? "").slice(0, 160))
        .join(" · ");
      bullets.push(`(${type}) ${top}`);
    }

    return {
      agentId: this.id,
      summary: `${memory.length} relevant memor${memory.length === 1 ? "y" : "ies"} recalled.`,
      bullets: bullets.slice(0, 6),
      followUp: null,
    };
  }
}

export const memoryAgent = new MemoryAgent();
export default memoryAgent;