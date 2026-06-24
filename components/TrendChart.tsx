"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import type { FusedWeatherResult } from "@/lib/fusion/schema";

/** 7-day temperature trend — PRD §7.2 (Recharts). */
export function TrendChart({ data }: { data: FusedWeatherResult }) {
  const chartData = data.days.map((d) => ({
    day: weekdayShort(d.date),
    High: d.tempMax,
    Low: d.tempMin,
  }));

  return (
    <div className="card p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-700">7-Day Temperature Trend</h3>
      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 11, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
              unit="°"
              domain={["dataMin - 2", "dataMax + 2"]}
            />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
              formatter={(v: number) => `${Math.round(v)}°C`}
            />
            <Line type="monotone" dataKey="High" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} name="High" />
            <Line type="monotone" dataKey="Low" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 3 }} name="Low" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function weekdayShort(iso: string): string {
  const [y, m, d] = iso.split("-").map((n) => parseInt(n, 10));
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", { weekday: "short" });
}
