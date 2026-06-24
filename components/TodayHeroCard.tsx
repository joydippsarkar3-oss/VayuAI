"use client";

import type { FusedWeatherResult } from "@/lib/fusion/schema";
import { WeatherIcon } from "./Icons";
import { ConfidenceBadge } from "./ConfidenceBadge";

/**
 * "Today at a Glance" hero — PRD §6.1.
 * Big current-condition readout + AI-generated plain-language summary.
 */
export function TodayHeroCard({ data }: { data: FusedWeatherResult }) {
  const t = data.today;
  return (
    <div className="card overflow-hidden">
      <div className="bg-gradient-to-br from-sky-600 to-sky-500 p-5 text-white">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm font-medium uppercase tracking-wide text-sky-100">
              {data.city.name}
              {data.city.admin1 ? `, ${data.city.admin1}` : ""}
            </div>
            <div className="mt-1 flex items-end gap-2">
              <span className="text-5xl font-bold">
                {t.tempMax !== null ? `${Math.round(t.tempMax)}°` : "—"}
              </span>
              <span className="mb-1 text-sky-100">
                / {t.tempMin !== null ? `${Math.round(t.tempMin)}°` : "—"} C
              </span>
            </div>
            <div className="mt-1 capitalize text-sky-50">{t.conditionCode.replace("-", " ")}</div>
          </div>
          <WeatherIcon condition={t.conditionCode} className="h-16 w-16 drop-shadow" />
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
          <Stat label="Rain" value={t.rainfallMm !== null ? `${t.rainfallMm.toFixed(1)}mm` : "—"} />
          <Stat label="Wind" value={t.windKmh !== null ? `${Math.round(t.windKmh)}` : "—"} sub="km/h" />
          <Stat label="Humidity" value={t.humidity !== null ? `${Math.round(t.humidity)}` : "—"} sub="%" />
          <Stat label="UV" value={t.uvIndex !== null ? `${Math.round(t.uvIndex)}` : "—"} />
        </div>

        {(t.sunrise || t.sunset) && (
          <div className="mt-3 flex justify-center gap-6 text-xs text-sky-100">
            {t.sunrise && <span>🌅 {fmtTime(t.sunrise)}</span>}
            {t.sunset && <span>🌇 {fmtTime(t.sunset)}</span>}
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            AI Daily Summary
          </h2>
          <ConfidenceBadge score={t.confidence} />
        </div>
        <p className="text-[15px] leading-relaxed text-slate-700">{data.todaySummary}</p>
        <p className="mt-3 text-[11px] text-slate-400">
          Fused from {data.sourcesUsed.length} live source
          {data.sourcesUsed.length !== 1 ? "s" : ""}. Refreshed {timeAgo(data.fetchedAt)}.
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg bg-white/10 py-2">
      <div className="text-[10px] uppercase tracking-wide text-sky-100">{label}</div>
      <div className="text-base font-semibold">
        {value}
        {sub && <span className="ml-0.5 text-[10px] font-normal text-sky-100">{sub}</span>}
      </div>
    </div>
  );
}

function fmtTime(iso: string): string {
  // iso like "2026-06-21T05:24" (IST, no offset)
  const time = iso.split("T")[1] ?? iso;
  const [h, m] = time.split(":").map((n) => parseInt(n, 10));
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  return `${hrs}h ago`;
}
