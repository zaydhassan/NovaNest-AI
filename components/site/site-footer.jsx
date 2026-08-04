import Link from "next/link";
import { ArrowRight, ArrowUp } from "lucide-react";
import { Logo } from "@/components/site/logo";

// Only real, reachable destinations are listed. Dead "#" / non-existent
// routes (/docs, Privacy/Terms) were removed rather than shipped as
// non-functional links — add them back when the real pages exist.
const columns = [
  {
    title: "Product",
    links: [
      { label: "Resume Builder", href: "/resume" },
      { label: "Cover Letters", href: "/ai-cover-letter" },
      { label: "Interview Prep", href: "/interview" },
      { label: "Dashboard", href: "/dashboard" },
    ],
  },
  {
    title: "Career OS",
    links: [
      { label: "Applications", href: "/applications" },
      { label: "Career Twin", href: "/twin" },
      { label: "GitHub Analyzer", href: "/github" },
      { label: "Learning Engine", href: "/learning" },
    ],
  },
  {
    title: "AI Copilot",
    links: [
      { label: "Coach", href: "/coach" },
      { label: "Career Intelligence", href: "/intelligence" },
      { label: "Career Timeline", href: "/timeline" },
      { label: "Dream Company", href: "/dream-company" },
    ],
  },
];

/**
 * SiteFooter — multi-column marketing footer with brand and link columns.
 * Decorative top border carries the aurora gradient. Rendered globally (root
 * layout), so it stays link-only — no auth-gated CTAs that'd read oddly for
 * signed-in users — and a no-JS back-to-top anchor targeting #main-content.
 */
export function SiteFooter() {
  return (
    <footer className="relative mt-24 border-t border-border/60 bg-gradient-to-b from-transparent via-background/40 to-background/80">
      <div
        className="absolute inset-x-0 -top-px h-px ring-aurora opacity-70"
        aria-hidden="true"
      />
      <div className="container mx-auto px-4 py-14">
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
          {/* Brand */}
          <div className="col-span-2 space-y-5 sm:col-span-3 lg:col-span-2">
            <Logo />
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              The AI Career Operating System. One workspace that remembers your
              career — and thinks alongside you.
            </p>
            <div className="max-w-xs rounded-2xl border border-border/60 bg-white/[0.03] p-4">
              <p className="text-sm font-medium text-foreground">
                Your career, compounded.
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Resume, applications, interviews, and goals — finally in one place.
              </p>
              <Link
                href="/dashboard"
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary underline-offset-4 hover:underline"
              >
                Open the dashboard
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Link columns */}
          <nav aria-label="Footer" className="col-span-2 grid grid-cols-2 gap-x-8 gap-y-10 sm:col-span-3 sm:grid-cols-3 lg:col-span-3">
            {columns.map((col) => (
              <div key={col.title} className="space-y-3.5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
                  {col.title}
                </h3>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-6 text-sm text-muted-foreground sm:flex-row">
          <p>© 2026 NovaNest AI. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <p className="flex items-center gap-1.5">
              Crafted with <span className="text-primary">♦</span> for careers that compound.
            </p>
            <a
              href="#main-content"
              className="inline-flex items-center gap-1 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded"
            >
              Back to top
              <ArrowUp className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;