"use client";

import React, { useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * SpotlightCard — a surface that reacts to the cursor with a soft radial
 * light and a gradient hairline that traces the pointer. Purely decorative
 * layers (`.spotlight-card__glow` / `__ring`, defined in globals.css) are
 * driven by `--mx` / `--my` CSS vars set here via a rAF-throttled handler.
 *
 * Rests as a normal card; only comes alive on hover. Respects reduced-motion
 * (the glow still shows statically on hover, just no cursor tracking).
 *
 * @param {{ className?: string, children: React.ReactNode, as?: keyof JSX.IntrinsicElements }}
 */
export function SpotlightCard({ className, children, as: Tag = "div", ...props }) {
  const ref = useRef(null);
  const rafRef = useRef(null);

  const onMouseMove = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
      el.style.setProperty("--my", `${e.clientY - rect.top}px`);
    });
  }, []);

  return (
    <Tag
      ref={ref}
      onMouseMove={onMouseMove}
      className={cn("spotlight-card", className)}
      {...props}
    >
      <span className="spotlight-card__glow" aria-hidden="true" />
      <span className="spotlight-card__ring" aria-hidden="true" />
      {children}
    </Tag>
  );
}

export default SpotlightCard;