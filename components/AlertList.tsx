"use client";

import type { WeatherAlert } from "@/lib/alerts";

/** Smart alerts list — PRD §6.4. Surfaces severe-weather warnings in-UI. */
export function AlertList({ alerts }: { alerts: WeatherAlert[] }) {
  if (alerts.length === 0) {
    return (
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-slate-700">Smart Alerts</h3>
        <p className="mt-1 text-sm text-slate-500">
          No severe-weather alerts for the next 7 days. ☑️
        </p>
      </div>
    );
  }

  const ordered = [...alerts].sort(bySeverity);

  return (
    <div className="card p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Smart Alerts</h3>
        <span className="chip bg-saffron-100 text-saffron-600">
          {ordered.length} active
        </span>
      </div>
      <ul className="space-y-2">
        {ordered.map((a) => (
          <li
            key={a.id}
            className={`rounded-lg p-2.5 text-sm ${tone(a.severity)}`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold">{a.title}</span>
              <span className="text-[11px] uppercase tracking-wide opacity-70">
                {a.dayLabel}
              </span>
            </div>
            <p className="mt-0.5 text-xs leading-relaxed">{a.message}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function tone(sev: WeatherAlert["severity"]): string {
  switch (sev) {
    case "severe":
      return "bg-red-50 text-red-800 ring-1 ring-red-200";
    case "warning":
      return "bg-saffron-50 text-saffron-600 ring-1 ring-saffron-100";
    default:
      return "bg-sky-50 text-sky-700 ring-1 ring-sky-100";
  }
}

function bySeverity(a: WeatherAlert, b: WeatherAlert): number {
  const order: Record<string, number> = { severe: 0, warning: 1, info: 2 };
  return (order[a.severity] ?? 3) - (order[b.severity] ?? 3);
}
