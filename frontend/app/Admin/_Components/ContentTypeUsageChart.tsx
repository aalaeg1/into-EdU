"use client";

import * as React from "react";
import {
    BarChart,
    Bar,
    ResponsiveContainer,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from "recharts";

export type TypeCount = { type: string; count: number };

type Props = {
    typeCounts: TypeCount[];
};

export function ContentTypeUsageChart({ typeCounts }: Props) {
    const data = React.useMemo(
        () => typeCounts.map((t) => ({ name: t.type, value: t.count })),
        [typeCounts]
    );

    return (
        <div className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#6366f1" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
