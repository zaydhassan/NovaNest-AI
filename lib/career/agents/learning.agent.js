import BaseAgent from "@/lib/career/agents/base";

class LearningAgent extends BaseAgent {
  constructor() {
    super({
      id: "learning",
      role: "learning + skills planner",
      capabilities: ["learning", "skills", "study-plan", "upskilling", "roadmap"],
      task: (ctx) =>
        `Help the user plan their learning. ${
          ctx?.recommendedTopics?.length
            ? `Suggested next topics: ${ctx.recommendedTopics.map((t) => t.skill).join(", ")}. Ground your plan in these.`
            : "Recommend the most useful next skill to learn given their goal and history."
        } ${
          ctx?.goal?.targetRole
            ? `Their active goal: ${ctx.goal.targetRole}${ctx.goal.targetLevel ? ` (${ctx.goal.targetLevel})` : ""}.`
            : "They have no active goal set — suggest setting one at /learning."
        } Give a concrete, prioritized learning plan (this week → this month).`,
    });
  }
}

export const learningAgent = new LearningAgent();
export default learningAgent;