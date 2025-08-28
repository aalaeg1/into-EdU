"use client";

import * as React from "react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

export type MonthlyPoint = { label: string; key: string; value: number };

type Props = {
  monthlyCounts: MonthlyPoint[];
};

export default function DashboardChartWrapper({ monthlyCounts }: Props) {
  // recharts needs a stable array
  const data = React.useMemo(
      () => monthlyCounts.map((m) => ({ name: m.label, value: m.value })),
      [monthlyCounts]
  );

  return (
      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#2563eb" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
  );
}
