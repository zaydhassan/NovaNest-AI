import Link from "next/link";
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
];

/**
 * SiteFooter — multi-column marketing footer with brand and link columns.
 * Decorative top border carries the aurora gradient.
 */
export function SiteFooter() {
  return (
    <footer className="relative mt-24 border-t border-border/60 bg-background/40">
      <div className="absolute inset-x-0 -top-px h-px ring-aurora opacity-60" aria-hidden="true" />
      <div className="container mx-auto px-4 py-14">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-6">
          <div className="col-span-2 space-y-4">
            <Logo />
            <p className="max-w-xs text-sm text-muted-foreground">
              The AI Career Operating System. One workspace that remembers your
              career — and thinks alongside you.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title} className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">{col.title}</h3>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-6 text-sm text-muted-foreground sm:flex-row">
          <p>© 2026 NovaNest AI. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            Crafted with <span className="text-primary">♦</span> for careers that compound.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;