import React from "react";

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