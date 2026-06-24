"use client";

import type { AirQuality } from "@/lib/fusion/schema";

/** AQI card — PRD §6.6. Uses CPCB India bands for the advisory. */
export function AqiCard({ aqi }: { aqi: AirQuality | null }) {
  if (!aqi || aqi.usAqi === null) {
    return (
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-slate-700">Air Quality</h3>
        <p className="mt-1 text-sm text-slate-400">AQI data unavailable for this location.</p>
      </div>
    );
  }

  const color = aqiColor(aqi.usAqi);

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Air Quality</h3>
        <span className="text-[10px] text-slate-400">India CPCB band</span>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold text-white"
          style={{ background: color }}
        >
          {aqi.usAqi}
        </div>
        <div>
          <div className="text-base font-semibold text-slate-800">{aqi.category}</div>
          <div className="text-xs text-slate-500">
            PM2.5 {aqi.pm25 !== null ? `${aqi.pm25.toFixed(1)} µg/m³` : "—"}
          </div>
        </div>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-slate-600">{aqi.advisory}</p>
    </div>
  );
}

function aqiColor(aqi: number): string {
  if (aqi <= 50) return "#22c55e"; // good - green
  if (aqi <= 100) return "#eab308"; // moderate - yellow
  if (aqi <= 150) return "#f97316"; // unhealthy sensitive - orange
  if (aqi <= 200) return "#ef4444"; // unhealthy - red
  if (aqi <= 300) return "#a855f7"; // very unhealthy - purple
  return "#7f1d1d"; // severe - dark red
}
