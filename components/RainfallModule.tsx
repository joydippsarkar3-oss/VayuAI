"use client";

import type { FusedWeatherResult } from "@/lib/fusion/schema";

/**
 * Rainfall Intelligence — PRD §6.2.
 * 7-day rainfall with cumulative total + monsoon-season context.
 */
export function RainfallModule({ data }: { data: FusedWeatherResult }) {
  const days = data.days;
  const total7d = days.reduce(
    (s, d) => s + (d.rainfallMm ?? 0),
    0
  );
  const maxDay = days.reduce(
    (best, d) => (((d.rainfallMm ?? 0) > (best.rainfallMm ?? 0)) ? d : best),
    days[0]
  );
  const wetDays = days.filter((d) => (d.rainfallMm ?? 0) >= 0.3).length;
  const isMonsoon = inMonsoonWindow();

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Rainfall Intelligence</h3>
        {isMonsoon && (
          <span className="chip bg-sky-100 text-sky-700">Monsoon season</span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <Metric label="7-day total" value={`${total7d.toFixed(0)}`} unit="mm" />
        <Metric
          label="Wet days"
          value={`${wetDays}`}
          unit={`/ ${days.length}`}
        />
        <Metric
          label="Heaviest"
          value={maxDay.rainfallMm !== null ? `${maxDay.rainfallMm.toFixed(0)}` : "—"}
          unit="mm"
        />
      </div>

      {/* Bar chart */}
      <div className="mt-4 flex h-28 items-end justify-between gap-1.5">
        {days.map((d) => {
          const mm = d.rainfallMm ?? 0;
          const heightPct = Math.min(100, (mm / Math.max(10, maxDay.rainfallMm ?? 10)) * 100);
          return (
            <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex w-full flex-1 items-end">
                <div
                  className={`w-full rounded-t ${mm >= 30 ? "bg-sky-700" : mm >= 10 ? "bg-sky-500" : mm >= 0.3 ? "bg-sky-400" : "bg-slate-200"}`}
                  style={{ height: `${Math.max(4, heightPct)}%` }}
                  title={`${shortLabel(d.date)}: ${mm.toFixed(1)} mm`}
                />
              </div>
              <span className="text-[9px] text-slate-500">{shortLabel(d.date)}</span>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] text-slate-400">
        Bars show fused daily rainfall (mm). Heavier bars = higher flood-risk rainfall.
      </p>
    </div>
  );
}

function Metric({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="rounded-lg bg-slate-50 py-2">
      <div className="text-lg font-bold text-slate-800">
        {value}
        {unit && <span className="ml-0.5 text-[10px] font-normal text-slate-400">{unit}</span>}
      </div>
      <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
    </div>
  );
}

function shortLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map((n) => parseInt(n, 10));
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", { weekday: "short" }).slice(0, 2);
}

/** Monsoon window per PRD §13 (June–September). */
function inMonsoonWindow(): boolean {
  const m = new Date().getMonth() + 1; // 1-12
  return m >= 6 && m <= 9;
}
