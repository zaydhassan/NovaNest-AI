"use client";

import {
  Brain,
  GraduationCap,
  FileText,
  Briefcase,
  Sparkles,
  LineChart as LineIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Agent id → icon + accent. The Coach/celebration accent uses the warm emerald;
// analytics uses cyan; everything else stays solid. No gradients (reserved).
const META = {
  memory: { icon: Brain, label: "Memory", className: "text-accent" },
  interview: { icon: GraduationCap, label: "Interview", className: "text-primary" },
  resume: { icon: FileText, label: "Resume", className: "text-primary" },
  application: { icon: Briefcase, label: "Application", className: "text-accent-warm" },
  coach: { icon: Sparkles, label: "Coach", className: "text-primary" },
  analytics: { icon: LineIcon, label: "Analytics", className: "text-accent" },
};

export default function AgentBadge({ id, active = false }) {
  const meta = META[id] ?? META.coach;
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        active
          ? "border-primary/40 bg-primary/10"
          : "border-border bg-white/[0.03] text-muted-foreground",
        meta.className
      )}
      title={`${meta.label} agent contributed`}
    >
      <Icon className="h-3 w-3" />
      {meta.label}
    </span>
  );
}