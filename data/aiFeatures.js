import { Brain, MessageSquareText, Mic, Target, ShieldCheck, Zap } from "lucide-react";

export const aiFeatures = [
  {
    icon: Brain,
    title: "Context-aware generation",
    description:
      "NovaNest reads your full profile — roles, skills, goals — and writes copy that actually sounds like you, not a template.",
    accent: "cyan",
  },
  {
    icon: Mic,
    title: "Voice mock interviews",
    description:
      "Practice out loud with a real-time AI interviewer that adapts difficulty and scores your answers as you speak.",
    accent: "purple",
  },
  {
    icon: Target,
    title: "NovaScore readiness",
    description:
      "A single composite score tracks resume strength, interview reps, and skill coverage so you always know where you stand.",
    accent: "emerald",
  },
  {
    icon: MessageSquareText,
    title: "Role-specific questions",
    description:
      "Fresh interview questions generated for your exact role and seniority — behavioral, system design, and technical.",
    accent: "cyan",
  },
  {
    icon: Zap,
    title: "Instant ATS tuning",
    description:
      "One click rewrites your resume to match a job description's keywords and beat applicant tracking systems.",
    accent: "purple",
  },
  {
    icon: ShieldCheck,
    title: "Private by default",
    description:
      "Your data is encrypted at rest, scoped to your account, and never used to train shared models.",
    accent: "emerald",
  },
];