import { UserPlus, Layers, Workflow, TrendingUp } from "lucide-react";

// How the AI Career Operating System works: set up once, then it remembers
// and compounds. Replaces the generic SaaS onboarding boilerplate with the
// actual OS data-flow: every action writes to memory, the OS coordinates,
// and the guidance compounds.
export const howItWorks = [
  {
    title: "Tell it your career",
    description:
      "Onboarding seeds your industry, skills, and goal — the context every later decision is grounded in.",
    icon: <UserPlus className="w-8 h-8 text-primary" />,
  },
  {
    title: "Work in the workspace",
    description:
      "Every resume, mock, application, and quiz you run writes durable facts to your career memory.",
    icon: <Layers className="w-8 h-8 text-primary" />,
  },
  {
    title: "The OS coordinates",
    description:
      "An intent router dispatches the right specialist agent — interview, resume, application, analytics — acting on your real context.",
    icon: <Workflow className="w-8 h-8 text-primary" />,
  },
  {
    title: "Your career compounds",
    description:
      "Your Career Twin, health score, timeline, and weekly digest get richer with every action — so guidance gets sharper, not reset.",
    icon: <TrendingUp className="w-8 h-8 text-primary" />,
  },
];