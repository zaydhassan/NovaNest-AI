"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * HeaderScrollShell — client wrapper that gives the server-rendered SiteHeader
 * its sticky-glass behavior: invisible border + light blur at the top of the
 * page, then a hairline border, stronger blur, and a slightly shorter bar once
 * the user scrolls. The actual nav markup is passed as `children` so the
 * server-side `checkUser()` / Clerk islands stay intact.
 */
export function HeaderScrollShell({ children }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 z-50 w-full transition-all duration-300 ease-spring",
        scrolled
          ? "h-14 border-b border-white/10 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60"
          : "h-16 border-b border-transparent bg-background/30 backdrop-blur-md"
      )}
    >
      {children}
    </header>
  );
}

export default HeaderScrollShell;