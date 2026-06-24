"use client";

import type { FusedWeatherResult } from "@/lib/fusion/schema";

/**
 * Agriculture & Outdoor Mode — PRD §6.5.
 * Farmer-specific advisories: sowing/irrigation/pest risk + "good day to dry crops".
 * Heuristic-based for the MVP (the PRD's full model needs crop + soil data).
 */
export function AgricultureMode({ data }: { data: FusedWeatherResult }) {
  const t = data.today;
  const advisory = farmAdvisory(t);

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Agriculture & Outdoor Mode</h3>
        <span className="chip bg-leaf-100 text-leaf-600">Beta</span>
      </div>

      <div
        className={`mb-3 rounded-xl p-3 text-center ${
          advisory.dryOk ? "bg-leaf-50 text-leaf-600" : "bg-saffron-50 text-saffron-600"
        }`}
      >
        <div className="text-3xl">{advisory.dryOk ? "☀️" : "💧"}</div>
        <div className="mt-1 text-sm font-semibold">
          {advisory.dryOk ? "Good day to dry crops / clothes" : "Not ideal for drying"}
        </div>
      </div>

      <ul className="space-y-1.5 text-sm">
        {advisory.notes.map((n, i) => (
          <li key={i} className="flex gap-2 text-slate-600">
            <span className="text-leaf-500">▸</span>
            <span>{n}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function farmAdvisory(t: FusedWeatherResult["today"]) {
  const notes: string[] = [];
  const mm = t.rainfallMm ?? 0;
  const humidity = t.humidity ?? 0;
  const temp = t.tempMax ?? 0;
  const wind = t.windKmh ?? 0;

  // Drying conditions: low rain, moderate humidity, some wind & warmth.
  const dryOk = mm < 1 && humidity < 70 && wind >= 5 && temp >= 25;

  if (mm >= 10) {
    notes.push("Heavy rain expected — delay irrigation and pesticide spraying.");
  } else if (mm >= 1) {
    notes.push("Light rain likely — skip irrigation today.");
  } else if (humidity < 40 && temp >= 30) {
    notes.push("Dry and hot — irrigate early morning or evening to reduce loss.");
  } else {
    notes.push("Normal conditions — follow standard irrigation schedule.");
  }

  // Pest/disease risk (PRD: humidity + temp combos).
  if (humidity >= 80 && temp >= 25 && temp <= 32) {
    notes.push("High humidity with warm temps raises fungal disease risk — monitor crops.");
  } else if (humidity >= 70) {
    notes.push("Moderate pest pressure expected; scout fields for aphids and blight.");
  } else {
    notes.push("Pest/disease risk is low today.");
  }

  if (wind >= 35) {
    notes.push("Strong winds — avoid spraying; secure tall crops and stakes.");
  } else if (wind >= 20) {
    notes.push("Breezy — fine for spraying if rain stays away.");
  }

  if (temp >= 42) {
    notes.push("Extreme heat — provide shade/mulch and water livestock frequently.");
  }

  return { dryOk, notes };
}
