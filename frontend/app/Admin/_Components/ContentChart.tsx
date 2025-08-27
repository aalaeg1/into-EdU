"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const chartData = [
  { name: "Jan", value: 20 },
  { name: "Feb", value: 40 },
  { name: "Mar", value: 50 },
  { name: "Apr", value: 25 },
  { name: "May", value: 60 },
  { name: "Jun", value: 45 },
  { name: "Jul", value: 65 },
  { name: "Aug", value: 40 },
  { name: "Sep", value: 55 },
  { name: "Oct", value: 90 },
  { name: "Nov", value: 80 },
  { name: "Dec", value: 60 },
];

function ContentChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
        <XAxis dataKey="name" tick={{ fill: '#8884d8', fontSize: 14 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#8884d8', fontSize: 14 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ borderRadius: 8, background: '#fff', border: '1px solid #eee' }} />
        <Line type="monotone" dataKey="value" stroke="#3B5CFF" strokeWidth={4} dot={{ r: 6, fill: '#fff', stroke: '#3B5CFF', strokeWidth: 3 }} activeDot={{ r: 10, fill: '#fff', stroke: '#3B5CFF', strokeWidth: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
export default ContentChart;