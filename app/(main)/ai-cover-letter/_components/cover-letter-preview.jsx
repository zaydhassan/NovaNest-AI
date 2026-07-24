"use client";

import React from "react";
import dynamic from "next/dynamic";

// The Markdown editor (~300kB) is the entire weight of this component.
// Code-split it so it loads in its own chunk after hydration instead of
// blocking the cover-letter route's First Load JS.
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), {
  ssr: false,
  loading: () => (
    <div className="h-[700px] w-full animate-pulse rounded-lg bg-muted/40" />
  ),
});

const CoverLetterPreview = ({ content }) => {
  return (
    <div className="py-4" data-color-mode="dark">
      <MDEditor value={content} preview="preview" height={700} />
    </div>
  );
};

export default CoverLetterPreview;