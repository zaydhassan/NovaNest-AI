import React from "react";

/**
 * Layout for the authenticated app shell. Adds top spacing to clear the fixed
 * header and bottom spacing for breathing room. Pages own their own
 * containers so they can opt into full-bleed layouts when needed.
 */
export default function MainLayout({ children }) {
  return <div className="mt-24 mb-20 px-4">{children}</div>;
}