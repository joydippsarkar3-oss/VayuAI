"use client";

import type { FusedDayForecast } from "@/lib/fusion/schema";
import { WeatherIcon } from "./Icons";
import { ConfidenceBadge } from "./ConfidenceBadge";

/**
 * One day in the 7-day grid — PRD §6.1.
 * Shows weekday, condition icon, max/min temp, rain mm, wind, humidity, UV, confidence.
 */
export function ForecastCard({ day, isToday }: { day: FusedDayForecast; isToday: boolean }) {
  const weekday = labelFor(day.date, isToday);
  return (
    <div className={`card p-3 ${isToday ? "ring-2 ring-sky-500" : ""}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {weekday}
          </div>
          <div className="text-[11px] text-slate-400">{shortDate(day.date)}</div>
        </div>
        <WeatherIcon condition={day.conditionCode} className="h-9 w-9" />
      </div>

      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-2xl font-bold text-slate-900">
          {day.tempMax !== null ? `${Math.round(day.tempMax)}°` : "—"}
        </span>
        <span className="text-sm text-slate-500">
          {day.tempMin !== null ? `${Math.round(day.tempMin)}°` : "—"}
        </span>
      </div>

      <div className="mt-2 space-y-1 text-xs text-slate-600">
        <Row label="Rain">
          {day.rainfallMm !== null ? `${day.rainfallMm.toFixed(1)} mm` : "—"}
          {day.rainProbability !== null && (
            <span className="ml-1 text-slate-400">({day.rainProbability}%)</span>
          )}
        </Row>
        <Row label="Wind">{day.windKmh !== null ? `${Math.round(day.windKmh)} km/h` : "—"}</Row>
        <Row label="Humidity">{day.humidity !== null ? `${Math.round(day.humidity)}%` : "—"}</Row>
        <Row label="UV">{day.uvIndex !== null ? Math.round(day.uvIndex) : "—"}</Row>
      </div>

      <div className="mt-2">
        <MiniConfidence score={day.confidence} />
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-400">{label}</span>
      <span className="font-medium text-slate-700">{children}</span>
    </div>
  );
}

function MiniConfidence({ score }: { score: number }) {
  const color = score >= 75 ? "bg-leaf-500" : score >= 50 ? "bg-saffron-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-[10px] text-slate-500">{score}%</span>
    </div>
  );
}

function labelFor(iso: string, isToday: boolean): string {
  if (isToday) return "Today";
  const [y, m, d] = iso.split("-").map((n) => parseInt(n, 10));
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", { weekday: "short" });
}

function shortDate(iso: string): string {
  const [y, m, d] = iso.split("-").map((n) => parseInt(n, 10));
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

// Re-export so the page can show the full badge inline for "today".
export { ConfidenceBadge };
