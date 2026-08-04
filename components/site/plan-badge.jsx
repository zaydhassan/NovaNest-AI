import { Sparkles, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

const PLAN_META = {
  PRO: { label: "Pro", icon: Crown, className: "cta-gradient text-white" },
  TEAMS: { label: "Teams", icon: Crown, className: "cta-gradient text-white" },
  STARTER: { label: "Free", icon: Sparkles, className: "border border-white/15 bg-white/[0.04] text-muted-foreground" },
};

export function PlanBadge({ plan = "STARTER", className }) {
  const meta = PLAN_META[plan] ?? PLAN_META.STARTER;
  const Icon = meta.icon;
  const isFree = (plan ?? "STARTER") === "STARTER";

  const content = (
    <span
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold",
        meta.className,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {meta.label}
    </span>
  );

  if (isFree) {
    return (
      <a href="/#pricing" aria-label="Upgrade your plan" className="inline-flex">
        {content}
      </a>
    );
  }
  return content;
}

export default PlanBadge;