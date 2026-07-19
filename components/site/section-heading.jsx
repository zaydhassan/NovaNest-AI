import { cn } from "@/lib/utils";

/**
 * SectionHeading — eyebrow + title + subtitle, centered or left-aligned.
 * Used across the landing page for visual consistency.
 *
 * @param {{ eyebrow?: string, title: string, subtitle?: string, align?: "center" | "left", className?: string }}
 */
export function SectionHeading({ eyebrow, title, subtitle, align = "center", className }) {
  return (
    <div
      className={cn(
        "mb-12 max-w-3xl",
        align === "center" ? "mx-auto text-center" : "text-left",
        className
      )}
    >
      {eyebrow && (
        <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full ring-aurora" />
          {eyebrow}
        </span>
      )}
      <h2 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl lg:text-5xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-base text-muted-foreground md:text-lg">{subtitle}</p>
      )}
    </div>
  );
}

export default SectionHeading;