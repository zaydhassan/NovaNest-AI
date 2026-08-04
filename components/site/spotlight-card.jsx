"use client";

import React, { useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

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