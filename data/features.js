import {
  Sparkles,
  Radar,
  PenBox,
  KanbanSquare,
  GraduationCap,
  Rocket,
} from "lucide-react";

// The six product pillars of the AI Career Operating System. Each entry leads
// with the outcome the user gets, then the real capabilities that deliver it.
// These are not new features — they group the existing surfaces into the OS
// architecture. Icons stay as JSX to match the existing feature-grid layout.
export const features = [
  {
    icon: <Sparkles className="w-7 h-7" />,
    title: "AI Copilot",
    value: "Guidance that remembers you.",
    description:
      "A conversational copilot backed by long-term career memory and specialist agents — interview, resume, application, analytics, learning — that coordinate instead of guessing.",
  },
  {
    icon: <Radar className="w-7 h-7" />,
    title: "Career Intelligence",
    value: "See your career as a system.",
    description:
      "Industry and salary insights, a career-health score, readiness, skill growth, a weekly digest, and an auto-built timeline — one executive view of where you stand.",
  },
  {
    icon: <PenBox className="w-7 h-7" />,
    title: "Career Workspace",
    value: "Build documents that get you shortlisted.",
    description:
      "An ATS-scored resume builder, AI cover letters, and a tools suite — achievement rewriter, skill roadmap, outreach, job-fit — in one connected workspace.",
  },
  {
    icon: <KanbanSquare className="w-7 h-7" />,
    title: "Applications",
    value: "Run your pipeline, not a spreadsheet.",
    description:
      "A kanban tracker from saved to offer, with per-job ATS scoring, artifact linking, and AI next-steps grounded in each application.",
  },
  {
    icon: <GraduationCap className="w-7 h-7" />,
    title: "Interview Prep",
    value: "Walk in already rehearsed.",
    description:
      "Voice mock interviews that score you out loud, role-specific quizzes with improvement tips, and trend analytics that show your trajectory.",
  },
  {
    icon: <Rocket className="w-7 h-7" />,
    title: "Learning",
    value: "Grow on purpose, not by chance.",
    description:
      "Set a career goal, run a learning board, log sessions, and get next-topic recommendations driven by your mocks and live market signals.",
  },
];