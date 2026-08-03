"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Menu,
  LayoutDashboard,
  FileText,
  PenBox,
  KanbanSquare,
  Wand2,
  Bell,
  Github,
  Sparkles,
  Fingerprint,
  Rocket,
  Mic,
  ListChecks,
  LineChart,
  Brain,
  Flag,
  Target,
  Gauge,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/site/theme-toggle";

// Navigation grouped by the product pillars of the AI Career Operating System.
// Routes are unchanged — this is a regrouping of the same links.
const groups = [
  {
    label: "Home",
    links: [{ href: "/dashboard", label: "Home", icon: LayoutDashboard }],
  },
  {
    label: "Workspace",
    links: [
      { href: "/resume", label: "Resume Builder", icon: FileText },
      { href: "/ai-cover-letter", label: "Cover Letters", icon: PenBox },
      { href: "/ai-tools", label: "AI Tools", icon: Wand2 },
    ],
  },
  {
    label: "Pipeline",
    links: [{ href: "/applications", label: "Applications", icon: KanbanSquare }],
  },
  {
    label: "Prep",
    links: [
      { href: "/interview/mock", label: "Mock Interview", icon: Mic },
      { href: "/interview/quiz", label: "Quick Quiz", icon: ListChecks },
      { href: "/interview", label: "Trends", icon: LineChart },
    ],
  },
  {
    label: "Intelligence",
    links: [
      { href: "/coach", label: "AI Copilot", icon: Sparkles },
      { href: "/twin", label: "Career Twin", icon: Fingerprint },
      { href: "/github", label: "GitHub Analyzer", icon: Github },
      { href: "/learning", label: "Learning Engine", icon: Rocket },
      { href: "/memory", label: "Memory Engine", icon: Brain },
      { href: "/timeline", label: "Career Timeline", icon: Flag },
      { href: "/dream-company", label: "Dream Company", icon: Target },
      { href: "/intelligence", label: "Career Intelligence", icon: Gauge },
    ],
  },
  {
    label: "Inbox",
    links: [{ href: "/notifications", label: "Notifications", icon: Bell }],
  },
];

/**
 * MobileMenu — client island for the small-viewport nav. The signed-in
 * navigation items collapse into a slide-over Sheet grouped by OS pillar;
 * the theme toggle lives here too so users can switch themes on mobile.
 */
export function MobileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80 overflow-y-auto">
        <div className="mt-2 flex items-center justify-between">
          <span className="font-display text-lg font-bold">Menu</span>
          <ThemeToggle />
        </div>
        <Separator className="my-4" />
        <nav className="flex flex-col gap-5">
          {groups.map((group) => (
            <div key={group.label} className="flex flex-col gap-1">
              <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </p>
              {group.links.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <Separator className="my-4" />
        <Link href="/dashboard" onClick={() => setOpen(false)}>
          <Button className="w-full">Open dashboard</Button>
        </Link>
      </SheetContent>
    </Sheet>
  );
}

export default MobileMenu;