import Link from "next/link";
import { Github, Twitter, Linkedin, Mail } from "lucide-react";
import { Logo } from "@/components/site/logo";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Resume Builder", href: "/resume" },
      { label: "Cover Letters", href: "/ai-cover-letter" },
      { label: "Interview Prep", href: "/interview" },
      { label: "Industry Insights", href: "/dashboard" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", href: "/docs" },
      { label: "Architecture", href: "#" },
      { label: "Changelog", href: "#" },
      { label: "Support", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
      { label: "Security", href: "#" },
      { label: "Cookies", href: "#" },
    ],
  },
];

const socials = [
  { icon: Twitter, label: "Twitter", href: "#" },
  { icon: Github, label: "GitHub", href: "#" },
  { icon: Linkedin, label: "LinkedIn", href: "#" },
  { icon: Mail, label: "Email", href: "#" },
];

/**
 * SiteFooter — multi-column marketing footer with brand, link columns,
 * socials, and a legal bar. Decorative top border carries the aurora gradient.
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
              The AI career growth platform — build standout resumes, ace
              interviews, and stay ahead of your industry.
            </p>
            <div className="flex items-center gap-2">
              {socials.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
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
            Crafted with <span className="text-primary">♦</span> for ambitious careers.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;