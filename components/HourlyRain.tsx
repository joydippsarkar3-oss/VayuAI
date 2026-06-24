"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { HourlyPrecip } from "@/lib/fusion/schema";

/**
 * Hourly rain outlook — answers "will it rain at 12 PM / 3 PM / etc?"
 * Shows precipitation probability (%) for each of the next 24 hours, with a
 * colored bar (deeper blue = higher chance / heavier rain).
 *
 * Data comes from Open-Meteo's hourly endpoint (keyless).
 */
export function HourlyRain({ hourly }: { hourly: HourlyPrecip[] }) {
  if (!hourly || hourly.length === 0) {
    return (
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-slate-700">Next 24 Hours — Rain</h3>
        <p className="mt-1 text-sm text-slate-400">
          Hourly rain data is temporarily unavailable.
        </p>
      </div>
    );
  }

  // Find the peak rain window for the headline summary.
  const peak = hourly.reduce(
    (best, h) => (h.precipProb > best.precipProb ? h : best),
    hourly[0]
  );
  const peakHour = fmtHour(peak.time);

  const data = hourly.map((h) => ({
    label: shortHour(h.time),
    fullLabel: fmtHour(h.time),
    chance: h.precipProb,
    mm: h.precipMm,
    temp: h.temp,
  }));

  return (
    <div className="card p-4">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Next 24 Hours — Rain</h3>
        <span className="text-xs text-slate-500">{data.length}h outlook</span>
      </div>
      <p className="mb-3 text-xs text-slate-500">
        {peak.precipProb >= 30 ? (
          <>
            Highest rain chance: <strong className="text-sky-700">{peak.precipProb}%</strong> around{" "}
            <strong>{peakHour}</strong>
            {peak.precipMm > 0 ? ` (${peak.precipMm}mm expected)` : ""}.
          </>
        ) : (
          <>Rain is unlikely over the next 24 hours (peak chance {peak.precipProb}%).</>
        )}
      </p>

      <div className="h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
              interval={2}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
              unit="%"
              domain={[0, 100]}
            />
            <Tooltip
              cursor={{ fill: "#f0f9ff" }}
              contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
              formatter={(value: number, name: string) => {
                if (name === "chance") return [`${value}%`, "Rain chance"];
                return [value, name];
              }}
              labelFormatter={(_l, payload) => {
                const p = payload?.[0]?.payload;
                return p
                  ? `${p.fullLabel} · ${p.chance}% rain · ${p.temp}°C`
                  : "";
              }}
            />
            <Bar dataKey="chance" radius={[3, 3, 0, 0]}>
              {data.map((d, i) => (
                <Cell key={i} fill={barColor(d.chance)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Hour-by-hour legend strip */}
      <div className="mt-3 flex flex-wrap gap-1.5 text-[10px]">
        <Legend color="#bae6fd" label="<20%" />
        <Legend color="#7dd3fc" label="20-40%" />
        <Legend color="#38bdf8" label="40-60%" />
        <Legend color="#0284c7" label="60-80%" />
        <Legend color="#075985" label=">80%" />
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-slate-500">
      <span className="h-2 w-2 rounded-sm" style={{ background: color }} />
      {label}
    </span>
  );
}

/** Bar color by rain probability (lighter → deeper blue). */
function barColor(chance: number): string {
  if (chance >= 80) return "#075985";
  if (chance >= 60) return "#0284c7";
  if (chance >= 40) return "#38bdf8";
  if (chance >= 20) return "#7dd3fc";
  return "#bae6fd";
}

/** "14" for 2 PM — compact axis label. */
function shortHour(iso: string): string {
  const time = iso.split("T")[1] ?? iso;
  const h = parseInt(time.slice(0, 2), 10);
  return String(h % 12 === 0 ? 12 : h % 12);
}

/** "2 PM" for the tooltip / headline. */
function fmtHour(iso: string): string {
  const time = iso.split("T")[1] ?? iso;
  const h = parseInt(time.slice(0, 2), 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12} ${ampm}`;
}
