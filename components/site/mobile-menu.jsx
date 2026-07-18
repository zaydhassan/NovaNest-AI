"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, LayoutDashboard, FileText, PenBox, GraduationCap, KanbanSquare, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/site/theme-toggle";

const links = [
  { href: "/dashboard", label: "Industry Insights", icon: LayoutDashboard },
  { href: "/resume", label: "Resume Builder", icon: FileText },
  { href: "/ai-cover-letter", label: "Cover Letters", icon: PenBox },
  { href: "/interview", label: "Interview Prep", icon: GraduationCap },
  { href: "/applications", label: "Application Tracker", icon: KanbanSquare },
  { href: "/ai-tools", label: "AI Career Tools", icon: Wand2 },
];

/**
 * MobileMenu — client island for the small-viewport nav. The signed-in
 * navigation items collapse into a slide-over Sheet; the theme toggle lives
 * here too so users can switch themes on mobile.
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
      <SheetContent side="right" className="w-80">
        <div className="mt-2 flex items-center justify-between">
          <span className="font-display text-lg font-bold">Menu</span>
          <ThemeToggle />
        </div>
        <Separator className="my-4" />
        <nav className="flex flex-col gap-1">
          {links.map(({ href, label, icon: Icon }) => (
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