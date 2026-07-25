"use client";

import { Brain, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

const TYPE_ACCENT = {
  identity: "text-accent",
  interview: "text-primary",
  application: "text-accent-warm",
  skill: "text-accent",
  achievement: "text-accent-warm",
  career: "text-primary",
  learning: "text-accent",
  preference: "text-muted-foreground",
  project: "text-accent-warm",
  github: "text-muted-foreground",
};

/**
 * A single memory chip — shown in the memory drawer and under messages for
 * cited memories. Cited chips get a subtle gradient ring (reserved usage on
 * an icon/progress element); uncited chips in the drawer stay plain.
 */
export default function MemoryChip({ memory, cited = false, index }) {
  const accent = TYPE_ACCENT[memory?.type] ?? "text-muted-foreground";
  return (
    <div
      className={cn(
        "group rounded-xl border p-3 text-left transition-colors",
        cited
          ? "border-primary/30 bg-primary/[0.06]"
          : "border-border bg-white/[0.02] hover:bg-white/[0.04]"
      )}
    >
      <div className="mb-1 flex items-center gap-2">
        {cited && index != null && (
          <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full ring-aurora text-[10px] font-bold text-white">
            {index}
          </span>
        )}
        <span className={cn("text-[11px] font-semibold uppercase tracking-wide", accent)}>
          {memory?.type ?? "memory"}
        </span>
      </div>
      <p className="text-sm leading-snug text-foreground">{memory?.snippet ?? memory?.content}</p>
      {memory?.tags?.length > 0 && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          <Tag className="h-3 w-3 text-muted-foreground/60" />
          {memory.tags.slice(0, 4).map((t) => (
            <span key={t} className="text-[11px] text-muted-foreground">
              #{t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}