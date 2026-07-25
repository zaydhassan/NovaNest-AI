import React from "react";

/**
 * Layout for the authenticated app shell. Adds top spacing to clear the fixed
 * header and bottom spacing for breathing room. A faint grid-fade sits behind
 * the content for depth — purely decorative, pointer-events-none, and clipped
 * so it never causes overflow or horizontal scroll. Pages own their own
 * containers so they can opt into full-bleed layouts when needed.
 */
export default function MainLayout({ children }) {
  return (
    <div className="relative mt-24 mb-20 px-4">
      <div
        className="grid-fade pointer-events-none absolute inset-x-0 -top-10 h-[420px] opacity-60"
        aria-hidden="true"
      />
      <div className="relative">{children}</div>
    </div>
  );
}