import * as React from "react";
import { Inbox, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * StateBlock — the canonical empty / error / loading surfaces for NovaNest.
 *
 * Premium SaaS apps treat empty and error states as first-class UI, not
 * afterthoughts. These three exports give every page one consistent,
 * on-brand way to say "nothing here yet", "something went wrong", and
 * "we're loading" — without each page reinventing the layout.
 *
 * Visual: centered, generous spacing, a soft glass tile, a gradient icon
 * ring, and an optional action. Pure CSS — no JS, no animations that hurt
 * Lighthouse (a single fade-in via the `reveal` utility, gated on reduced
 * motion through the global stylesheet).
 */

function Tile({ children, className }) {
  return (
    <div
      className={cn(
        "relative mx-auto flex max-w-md flex-col items-center rounded-2xl border border-border/70 bg-card/50 px-8 py-12 text-center shadow-card backdrop-blur-sm",
        className
      )}
    >
      {children}
    </div>
  );
}

function IconRing({ children, tone = "neutral" }) {
  const tones = {
    neutral: "ring-aurora text-white",
    danger: "bg-destructive/15 text-destructive",
    warning: "bg-[hsl(38_92%_50%/0.15)] text-[hsl(38_92%_60%)]",
  };
  return (
    <div
      className={cn(
        "mb-5 grid h-14 w-14 place-items-center rounded-2xl shadow-glow",
        tones[tone]
      )}
    >
      {children}
    </div>
  );
}

/**
 * EmptyState — "nothing here yet". Pass an icon, a short title, a one-line
 * description, and an optional action (usually a Button).
 */
export function EmptyState({
  icon: Icon = Inbox,
  title = "Nothing here yet",
  description,
  action,
  className,
}) {
  return (
    <Tile className={className}>
      <IconRing>
        <Icon className="h-6 w-6" />
      </IconRing>
      <h3 className="text-lg font-semibold tracking-tight text-foreground">
        {title}
      </h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </Tile>
  );
}

/**
 * ErrorState — "something went wrong". Pass an optional `onRetry` to render
 * a retry button; otherwise just the message.
 */
export function ErrorState({
  icon: Icon = AlertTriangle,
  title = "Something went wrong",
  description = "We couldn't load this right now. Please try again in a moment.",
  onRetry,
  retryLabel = "Try again",
  className,
}) {
  return (
    <Tile className={className}>
      <IconRing tone="danger">
        <Icon className="h-6 w-6" />
      </IconRing>
      <h3 className="text-lg font-semibold tracking-tight text-foreground">
        {title}
      </h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex h-10 items-center gap-2 rounded-md border border-input bg-background/60 px-4 text-sm font-medium text-foreground backdrop-blur-sm transition-colors hover:bg-muted hover:border-foreground/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {retryLabel}
        </button>
      )}
    </Tile>
  );
}

/**
 * SkeletonCard — premium loading placeholder. A glass card with skeleton
 * lines that read as one system with the `.skeleton` utility.
 */
export function SkeletonCard({ className, lines = 3 }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/60 bg-card/40 p-6 shadow-card backdrop-blur-sm",
        className
      )}
    >
      <div className="skeleton mb-4 h-10 w-10 rounded-xl" />
      <div className="skeleton mb-3 h-4 w-2/3 rounded" />
      <div className="space-y-2.5">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="skeleton h-3 rounded"
            style={{ width: `${100 - i * 12}%` }}
          />
        ))}
      </div>
    </div>
  );
}