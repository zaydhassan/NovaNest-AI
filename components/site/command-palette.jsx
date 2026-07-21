"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useClerk, useUser } from "@clerk/nextjs";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Home,
  LayoutDashboard,
  FileText,
  PenBox,
  GraduationCap,
  KanbanSquare,
  Wand2,
  Sun,
  Moon,
  LogOut,
  Search,
  CornerDownLeft,
  Command,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * CommandPalette — ⌘K / Ctrl+K quick launcher. Glassmorphic, keyboard-first.
 * Routes the user to any app surface, toggles the theme, or signs out.
 * Renders nothing visible until invoked; the trigger lives in the header.
 */
export function CommandPalette({ className }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const { signOut } = useClerk();
  const { isSignedIn } = useUser();
  const itemRefs = useRef([]);

  // Global ⌘K / Ctrl+K toggles the palette.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Reset state whenever the palette closes.
  useEffect(() => {
    if (!open) {
      setQuery("");
      setActive(0);
    }
  }, [open]);

  // Keep the active row reset + in-bounds as the filtered list changes.
  useEffect(() => {
    setActive(0);
  }, [query]);

  const go = useCallback(
    (href) => {
      setOpen(false);
      router.push(href);
    },
    [router]
  );

  const toggleTheme = useCallback(() => {
    setOpen(false);
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }, [setTheme, resolvedTheme]);

  const logout = useCallback(() => {
    setOpen(false);
    signOut();
  }, [signOut]);

  // Full command table (actions bound to live callbacks).
  const all = useMemo(
    () => [
      { id: "home", label: "Home", group: "Navigate", icon: Home, run: () => go("/") },
      {
        id: "dashboard",
        label: "Dashboard",
        group: "Navigate",
        icon: LayoutDashboard,
        run: () => go("/dashboard"),
      },
      {
        id: "resume",
        label: "Resume Builder",
        group: "Navigate",
        icon: FileText,
        run: () => go("/resume"),
      },
      {
        id: "cover-letter",
        label: "Cover Letters",
        group: "Navigate",
        icon: PenBox,
        run: () => go("/ai-cover-letter"),
      },
      {
        id: "interview",
        label: "Interview Prep",
        group: "Navigate",
        icon: GraduationCap,
        run: () => go("/interview"),
      },
      {
        id: "applications",
        label: "Application Tracker",
        group: "Navigate",
        icon: KanbanSquare,
        run: () => go("/applications"),
      },
      {
        id: "ai-tools",
        label: "AI Career Tools",
        group: "Navigate",
        icon: Wand2,
        run: () => go("/ai-tools"),
      },
      {
        id: "theme",
        label: resolvedTheme === "dark" ? "Switch to light theme" : "Switch to dark theme",
        group: "Preferences",
        icon: resolvedTheme === "dark" ? Sun : Moon,
        run: toggleTheme,
      },
      ...(isSignedIn
        ? [
            {
              id: "signout",
              label: "Sign out",
              group: "Account",
              icon: LogOut,
              run: logout,
            },
          ]
        : []),
    ],
    [go, toggleTheme, logout, isSignedIn, resolvedTheme]
  );

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.group.toLowerCase().includes(q)
    );
  }, [all, query]);

  // Group while preserving order.
  const groups = useMemo(() => {
    const map = new Map();
    items.forEach((c) => {
      if (!map.has(c.group)) map.set(c.group, []);
      map.get(c.group).push(c);
    });
    return Array.from(map.entries());
  }, [items]);

  // Keyboard navigation inside the list.
  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const cmd = items[active];
      if (cmd) cmd.run();
    }
  };

  // Scroll the active row into view.
  useEffect(() => {
    const el = itemRefs.current[active];
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  return (
    <>
      {/* Visible trigger — sits in the header; the ⌘K shortcut also works. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open command palette"
        title="Search and navigate (⌘K)"
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          className
        )}
      >
        <Command className="h-4 w-4" />
      </button>

      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-[16%] z-50 w-[92vw] max-w-xl -translate-x-1/2 outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95"
          onKeyDown={onKeyDown}
        >
          {/* Accessible title/description (Radix requires these; kept sr-only). */}
          <DialogPrimitive.Title className="sr-only">
            Command palette
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Search commands and navigate NovaNest.
          </DialogPrimitive.Description>

          <div className="glass-strong overflow-hidden rounded-2xl border border-white/10 shadow-glass-lg">
            {/* Search row */}
            <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search commands…"
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                autoFocus
                spellCheck={false}
                aria-label="Search commands"
              />
              <kbd className="hidden shrink-0 rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-block">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {items.length === 0 ? (
                <div className="px-3 py-10 text-center text-sm text-muted-foreground">
                  No commands match &ldquo;{query}&rdquo;.
                </div>
              ) : (
                groups.map(([group, cmds]) => (
                  <div key={group} className="mb-1 last:mb-0">
                    <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {group}
                    </p>
                    {cmds.map((cmd) => {
                      const idx = items.indexOf(cmd);
                      const isActive = idx === active;
                      const Icon = cmd.icon;
                      return (
                        <button
                          key={cmd.id}
                          ref={(el) => (itemRefs.current[idx] = el)}
                          onMouseEnter={() => setActive(idx)}
                          onClick={cmd.run}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                            isActive
                              ? "bg-white/[0.06] text-foreground"
                              : "text-foreground/80 hover:bg-white/[0.04]"
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className="flex-1 truncate">{cmd.label}</span>
                          {isActive && (
                            <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer hints */}
            <div className="flex items-center justify-between border-t border-white/10 px-4 py-2 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <kbd className="rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-medium">
                  ↑ ↓
                </kbd>
                navigate
                <kbd className="ml-2 rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-medium">
                  ↵
                </kbd>
                select
              </span>
              <span className="font-medium">NovaNest</span>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
    </>
  );
}

export default CommandPalette;