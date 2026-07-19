import { cn } from "@/lib/utils";

/**
 * PageHeader — the standard in-app page title block. Gives every authenticated
 * page a consistent eyebrow / title / description / actions layout with the
 * same vertical rhythm, so the product reads as one system.
 *
 * @param {{ eyebrow?: string, title: string, description?: string, actions?: React.ReactNode, className?: string }}
 */
export function PageHeader({ eyebrow, title, description, actions, className }) {
  return (
    <div
      className={cn(
        "mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end",
        className
      )}
    >
      <div className="min-w-0">
        {eyebrow && (
          <span className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full ring-aurora" />
            {eyebrow}
          </span>
        )}
        <h1 className="aurora-text animate-aurora text-4xl font-extrabold tracking-tight md:text-5xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export default PageHeader;