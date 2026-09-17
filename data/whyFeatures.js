import {
  Brain,
  Workflow,
  Fingerprint,
  History,
  LayoutGrid,
  ShieldCheck,
} from "lucide-react";

/**
 * Feature definitions for the "Why NovaNest" section. Presentation data
 * only — the visuals themselves live in components/site/why/*-visual.jsx
 * and are paired by index in why-novanest.jsx.
 *
 * `tone` picks the accent treatment: "accent" (pink/magenta) or
 * "primary" (violet). The chain 01 → 06 mirrors the OS story:
 * memory → agents → twin → timeline → workspace → privacy.
 */
export const whyFeatures = [
  {
    icon: Brain,
    tone: "accent",
    title: "Remembers your whole career",
    description:
      "Not session state — durable memory that recalls your roles, mocks, and goals across every conversation, so every answer starts from you.",
  },
  {
    icon: Workflow,
    tone: "primary",
    title: "Coordinates specialist agents",
    description:
      "An intent router dispatches the right agent — interview, resume, application, analytics, learning — instead of one bloated prompt doing everything badly.",
  },
  {
    icon: Fingerprint,
    tone: "accent",
    title: "A Career Twin that talks like you",
    description:
      "An AI model of you, rebuilt from your history, that answers questions in your voice and surfaces what you'd say in the room.",
  },
  {
    icon: History,
    tone: "primary",
    title: "A timeline that builds itself",
    description:
      "Every action auto-derives a career timeline — no manual journaling, no separate log. Your history writes itself as you work.",
  },
  {
    icon: LayoutGrid,
    tone: "accent",
    title: "One workspace, not five tabs",
    description:
      "Resume, applications, interviews, insights, and learning — connected, not copy-pasted between disconnected tools.",
  },
  {
    icon: ShieldCheck,
    tone: "accent",
    title: "Private by default",
    description:
      "Encrypted at rest, scoped to your account, and never used to train shared models. Your career stays yours.",
  },
];