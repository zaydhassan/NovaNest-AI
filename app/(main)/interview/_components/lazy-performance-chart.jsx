"use client";

import dynamic from "next/dynamic";

const PerformanceChart = dynamic(() => import("./performace-chart"), {
  ssr: false,
  loading: () => <div className="h-[360px] shimmer rounded-2xl" />,
});

export default function LazyPerformanceChart(props) {
  return <PerformanceChart {...props} />;
}