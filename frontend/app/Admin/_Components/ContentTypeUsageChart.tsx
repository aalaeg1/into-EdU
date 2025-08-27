"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LabelList } from "recharts";

const data = [
  { name: "Interactive Video", thisWeek: 80, lastWeek: 100 },
  { name: "Quiz", thisWeek: 60, lastWeek: 80 },
  { name: "Course Presentation.", thisWeek: 40, lastWeek: 60 },
  { name: "Interactive Book", thisWeek: 47, lastWeek: 30 },
  { name: "Multiple Choice", thisWeek: 20, lastWeek: 40 },
  { name: "Drag & Drop", thisWeek: 85, lastWeek: 70 },
  { name: "Fill in the Blanks", thisWeek: 60, lastWeek: 65 },
];

export function ContentTypeUsageChart() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data} barSize={28} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
        <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 13 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#6B7280', fontSize: 13 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ borderRadius: 14, background: '#fff', border: '1px solid #eee', fontSize: 18, padding: '14px 18px', minWidth: 140 }} />
        <Legend verticalAlign="top" align="right" iconType="circle" height={36} formatter={(value) => {
          if (value === 'thisWeek') return <span style={{ color: '#6366F1', fontWeight: 600 }}>This Week</span>;
          if (value === 'lastWeek') return <span style={{ color: '#A5B4FC', fontWeight: 600 }}>Last Week</span>;
          return value;
        }} />
        <Bar dataKey="thisWeek" fill="#6366F1" radius={[6, 6, 0, 0]} animationDuration={900}>
          <LabelList dataKey="thisWeek" position="top" fill="#6366F1" fontSize={12} formatter={(v) => v === 47 ? v : ''} />
        </Bar>
        <Bar dataKey="lastWeek" fill="#A5B4FC" radius={[6, 6, 0, 0]} animationDuration={900} />
      </BarChart>
    </ResponsiveContainer>
  );
} 