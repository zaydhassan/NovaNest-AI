"use client";

import dynamic from "next/dynamic";

// Client wrapper so recharts can be code-split with ssr:false from the
// (server) interview page — same pattern as lazy-performance-chart.jsx.
const InterviewTrendChart = dynamic(() => import("./interview-trend-chart"), {
  ssr: false,
  loading: () => <div className="h-[360px] animate-pulse rounded-2xl bg-muted/30" />,
});

export default function LazyInterviewTrendChart(props) {
  return <InterviewTrendChart {...props} />;
}