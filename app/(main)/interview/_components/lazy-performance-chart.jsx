"use client";

import dynamic from "next/dynamic";

// Client wrapper so recharts can be code-split with ssr:false from the
// (server) interview page. `next/dynamic` with ssr:false isn't allowed inside
// Server Components, so the heavy chart lives behind this thin client island.
const PerformanceChart = dynamic(() => import("./performace-chart"), {
  ssr: false,
  loading: () => <div className="h-[360px] animate-pulse rounded-2xl bg-muted/30" />,
});

export default function LazyPerformanceChart(props) {
  return <PerformanceChart {...props} />;
}