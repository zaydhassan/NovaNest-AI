"use client";

import React from "react";
import dynamic from "next/dynamic";

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