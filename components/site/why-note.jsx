import { HelpCircle } from "lucide-react";

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