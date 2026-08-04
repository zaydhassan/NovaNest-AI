"use client";

import dynamic from "next/dynamic";

const InterviewTrendChart = dynamic(() => import("./interview-trend-chart"), {
  ssr: false,
  loading: () => <div className="h-[360px] shimmer rounded-2xl" />,
});

export default function LazyInterviewTrendChart(props) {
  return <InterviewTrendChart {...props} />;
}