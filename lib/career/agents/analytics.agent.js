/**
 * Analytics Agent (M5) — surfaces the user's own metrics (Career Health,
 * interview readiness, recent trends) so the Coordinator can reference them
 * in its reply. Pure: no Gemini call; it just turns the ctx metrics into
 * bullets. The Coordinator pre-computes the metrics so this agent is free.
 *
 * Server-only.
 */
import BaseAgent from "@/lib/career/agents/base";

class AnalyticsAgent extends BaseAgent {
  constructor() {
    super({
      id: "analytics",
      role: "career metrics + trends",
      capabilities: ["metrics", "stats", "trends", "health"],
    });
  }

  async run({ ctx = {} } = {}) {
    const bullets = [];
    const m = ctx.metrics || {};

    if (m.healthScore != null) {
      bullets.push(`Career Health: ${m.healthScore}/100 (${m.healthLevel ?? ""}).`);
    }
    if (m.readinessScore != null) {
      bullets.push(
        `Interview readiness: ${m.readinessScore}/100 — ${m.readinessLevel ?? ""}.`
      );
    }
    if (m.mockCount != null) {
      bullets.push(`${m.mockCount} mock interview(s) on record${m.avgMock != null ? `, avg ${m.avgMock}/100` : ""}.`);
    }
    if (m.applicationCount != null) {
      bullets.push(`${m.applicationCount} application(s) tracked${m.offerCount ? `, ${m.offerCount} offer(s)` : ""}.`);
    }
    if (m.streak != null) {
      bullets.push(`${m.streak}-day activity streak.`);
    }

    if (!bullets.length) {
      return {
        agentId: this.id,
        summary: "Not enough activity yet to surface metrics.",
        bullets: ["Encourage the user to save a resume, run a mock, or track an application."],
        followUp: null,
      };
    }

    return {
      agentId: this.id,
      summary: "Current metrics pulled from the user's Career OS data.",
      bullets,
      followUp: null,
    };
  }
}

export const analyticsAgent = new AnalyticsAgent();
export default analyticsAgent;