import { HelpCircle } from "lucide-react";

/**
 * WhyNote — the shared "why/explanation" rendering convention. A muted box with
 * a short uppercase label + the rationale text. Parameterized via `label` so the
 * Career Intelligence cards can reuse one component for Why / How to improve /
 * What to improve / Evidence.
 *
 * Lifted from the local `WhyNote` in dream-company/_components/sections.jsx
 * (which mirrors the "Improvement tip" pattern in quiz-result.jsx). The local
 * dream-company copy is left in place — this shared one is additive, used by
 * the /intelligence surface.
 *
 * @param {{ children?: React.ReactNode, label?: string, className?: string }} props
 */
export function WhyNote({ children, label = "Why", className = "" }) {
  if (children == null || children === "") return null;
  return (
    <div className={`mt-2 rounded-lg border border-border bg-muted/40 p-2.5 ${className}`}>
      <p className="mb-0.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        <HelpCircle className="h-3 w-3" /> {label}
      </p>
      <p className="text-xs leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}

export default WhyNote;