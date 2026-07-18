import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * NovaMark — the NovaNest AI brandmark.
 * A four-point nova burst nested in a rounded "nest" badge. Pure SVG so there
 * is no image payload (the previous build shipped a 1.4MB logo.png).
 */
export function NovaMark({ className, size = 36 }) {
  return (
    <span
      className={cn("relative inline-grid place-items-center rounded-xl ring-aurora", className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 48 48"
        fill="none"
        width={size}
        height={size}
        className="relative z-10"
      >
        <defs>
          <linearGradient id="nova-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffffff" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0.78" />
          </linearGradient>
        </defs>
        {/* nova burst */}
        <path
          d="M24 6 L27.2 20.8 L42 24 L27.2 27.2 L24 42 L20.8 27.2 L6 24 L20.8 20.8 Z"
          fill="url(#nova-grad)"
        />
        <circle cx="24" cy="24" r="3.4" fill="hsl(230 47% 7%)" />
      </svg>
    </span>
  );
}

/**
 * Logo — brandmark + wordmark. Used in header, footer, auth pages, landing.
 * @param {{ href?: string, showWordmark?: boolean, className?: string, markSize?: number }}
 */
export function Logo({ href = "/", showWordmark = true, className, markSize = 34 }) {
  const content = (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <NovaMark size={markSize} />
      {showWordmark && (
        <span className="font-display text-lg font-bold tracking-tight">
          NovaNest<span className="text-primary"> AI</span>
        </span>
      )}
    </span>
  );

  if (!href) return content;

  return (
    <Link href={href} className="inline-flex items-center gap-2.5 rounded-lg focus-visible:ring-2 focus-visible:ring-ring" aria-label="NovaNest AI — home">
      {content}
    </Link>
  );
}

export default Logo;