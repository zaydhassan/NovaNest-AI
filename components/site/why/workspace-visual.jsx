import {
  FileText,
  Send,
  MessagesSquare,
  GraduationCap,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * WorkspaceVisual — connected workspace layers for Card 05: the five
 * products fanned as one deck rather than five separate tabs. Rotation
 * lives on the wrapper (inline transform); hover drift on the inner
 * panel so the two transforms never conflict.
 */
const LAYERS = [
  { label: "Resume", icon: FileText, tone: "text-primary" },
  { label: "Applications", icon: Send, tone: "text-accent" },
  { label: "Interviews", icon: MessagesSquare, tone: "text-primary" },
  { label: "Learning", icon: GraduationCap, tone: "text-accent" },
  { label: "Insights", icon: TrendingUp, tone: "text-primary", top: true },
];

export function WorkspaceVisual() {
  return (
    <div className="relative h-full w-full">
      {LAYERS.map((layer, i) => {
        const Icon = layer.icon;
        return (
          <div
            key={layer.label}
            className="absolute left-1/2 w-[88%] max-w-[290px]"
            style={{
              top: `${8 + i * 18}%`,
              transform: `translateX(-50%) rotate(${(i - 2) * 0.5}deg)`,
              zIndex: i + 1,
            }}
          >
            <div
              className={cn(
                "flex w-full items-center gap-1.5 rounded-lg border border-white/[0.07] bg-[#101219]/95 px-2 py-1.5 shadow-[0_10px_26px_-14px_rgba(0,0,0,0.9)] transition-transform duration-500 ease-spring group-hover:-translate-y-0.5",
                layer.top &&
                  "border-white/[0.12] transition-[transform,border-color] duration-500 group-hover:border-primary/30"
              )}
              style={{ transitionDelay: `${i * 30}ms` }}
            >
              <Icon className={cn("h-2.5 w-2.5 shrink-0", layer.tone)} />
              <span className="truncate text-[9px] font-medium text-white/75">
                {layer.label}
              </span>
              <span className="ml-auto h-1 w-1 shrink-0 rounded-full bg-white/20" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default WorkspaceVisual;