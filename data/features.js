import { BrainCircuit, Briefcase, LineChart, ScrollText } from "lucide-react";

// Value-first feature copy: each entry leads with the outcome the user gets,
// then the capability that delivers it. Icons and order are unchanged so the
// existing feature grid keeps its layout.
export const features = [
  {
    icon: <BrainCircuit className="w-7 h-7" />,
    title: "AI-Powered Career Insights",
    value: "Know your next move before the market does.",
    description:
      "Receive data-driven career advice aligned with live market trends and your unique profile — so every decision is backed by evidence, not guesswork.",
  },
  {
    icon: <ScrollText className="w-7 h-7" />,
    title: "Personalized Interview Practice",
    value: "Walk into every interview already rehearsed.",
    description:
      "Simulated, role-specific questions with real-time feedback on tone, structure, and coverage — calibrated to the exact role you're targeting.",
  },
  {
    icon: <LineChart className="w-7 h-7" />,
    title: "Industry Analytics",
    value: "See salary, demand, and skill trends as they shift.",
    description:
      "In-depth analytics on salary bands, hiring momentum, and skills demand in your field — updated continuously, so you negotiate from a position of facts.",
  },
  {
    icon: <Briefcase className="w-7 h-7" />,
    title: "Smart Resume & Cover Letter",
    value: "Generate ATS-optimized documents that get you shortlisted.",
    description:
      "Build polished, applicant-tracking-system-ready resumes and cover letters in minutes — tailored to each role, optimized for the keywords recruiters scan for.",
  },
];