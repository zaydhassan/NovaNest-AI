"use client";

import { Sparkles } from "lucide-react";

/**
 * Clickable suggested prompts shown when a session is empty. Clicking sends
 * the prompt straight into the chat.
 */
export default function SuggestedPrompts({ prompts = [], onPick, loading = false }) {
  if (!prompts.length) return null;
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {prompts.map((p, i) => (
        <button
          key={i}
          type="button"
          disabled={loading}
          onClick={() => onPick?.(p)}
          className="group flex items-start gap-2.5 rounded-xl border border-border bg-white/[0.02] p-3 text-left text-sm text-foreground/90 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-white/[0.04] disabled:opacity-50"
        >
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span className="flex-1">{p}</span>
        </button>
      ))}
    </div>
  );
}