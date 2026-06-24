"use client";

import { useSavedCities, type SavedCity } from "@/lib/store";
import type { FusedWeatherResult } from "@/lib/fusion/schema";

/**
 * Saved-cities sidebar — PRD §6.3 (up to 10 on free tier).
 * Lets the user save the current location and switch quickly between saved cities.
 */
export function SavedCities({
  current,
  activeData,
  onPick,
}: {
  current: SavedCity | null;
  activeData: FusedWeatherResult | null;
  onPick: (city: SavedCity) => void;
}) {
  const { cities, addCity, removeCity, hasCity } = useSavedCities();
  const currentName = activeData?.city.name;
  const canSave =
    !!currentName && (!hasCity(currentName) ? cities.length < 10 : true);

  function handleSave() {
    if (!activeData) return;
    addCity({
      name: activeData.city.name,
      admin1: activeData.city.admin1,
      latitude: activeData.city.latitude,
      longitude: activeData.city.longitude,
    });
  }

  return (
    <div className="card p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Saved Cities</h3>
        <span className="text-xs text-slate-400">{cities.length}/10</span>
      </div>

      {currentName && (
        <button
          onClick={handleSave}
          disabled={!canSave}
          className={`mb-3 w-full rounded-lg px-3 py-2 text-sm font-medium ${
            canSave
              ? "bg-sky-600 text-white hover:bg-sky-700"
              : "cursor-not-allowed bg-slate-100 text-slate-400"
          }`}
        >
          {hasCity(currentName) ? "✓ Saved" : "+ Save current city"}
        </button>
      )}

      {cities.length === 0 ? (
        <p className="text-xs text-slate-400">
          No saved cities yet. Search and save up to 10 for quick access.
        </p>
      ) : (
        <ul className="space-y-1">
          {cities.map((c) => (
            <li
              key={c.name}
              className={`group flex items-center justify-between rounded-lg px-2 py-1.5 text-sm ${
                current?.name === c.name ? "bg-sky-50" : "hover:bg-slate-50"
              }`}
            >
              <button
                onClick={() => onPick(c)}
                className="flex-1 text-left"
              >
                <span className="font-medium text-slate-700">{c.name}</span>
                {c.admin1 && (
                  <span className="ml-1 text-xs text-slate-400">{c.admin1}</span>
                )}
              </button>
              <button
                onClick={() => removeCity(c.name)}
                className="ml-2 text-slate-300 opacity-0 transition group-hover:opacity-100 hover:text-red-500"
                aria-label={`Remove ${c.name}`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
