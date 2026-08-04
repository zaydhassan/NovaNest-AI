import { memoryAgent } from "@/lib/career/agents/memory.agent";
import { interviewAgent } from "@/lib/career/agents/interview.agent";
import { resumeAgent } from "@/lib/career/agents/resume.agent";
import { applicationAgent } from "@/lib/career/agents/application.agent";
import { coachAgent } from "@/lib/career/agents/coach.agent";
import { analyticsAgent } from "@/lib/career/agents/analytics.agent";
import { learningAgent } from "@/lib/career/agents/learning.agent";

export const AGENTS = {
  memory: memoryAgent,
  interview: interviewAgent,
  resume: resumeAgent,
  application: applicationAgent,
  coach: coachAgent,
  analytics: analyticsAgent,
  learning: learningAgent,
};

export const AGENT_IDS = Object.keys(AGENTS);

export function getAgent(id) {
  return AGENTS[id] ?? null;
}

export function resolveAgentIds(ids = []) {
  const valid = Array.isArray(ids)
    ? ids.map((id) => String(id)).filter((id) => AGENTS[id])
    : [];
  const deduped = Array.from(new Set(valid)).slice(0, 3);
  return deduped.length ? deduped : ["coach"];
}

export { memoryAgent, interviewAgent, resumeAgent, applicationAgent, coachAgent, analyticsAgent, learningAgent };