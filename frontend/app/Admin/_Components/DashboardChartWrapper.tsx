"use client";
import dynamic from "next/dynamic";
const ContentChart = dynamic(() => import("./ContentChart"), { ssr: false });

export default function DashboardChartWrapper() {
  return <ContentChart />;
} 