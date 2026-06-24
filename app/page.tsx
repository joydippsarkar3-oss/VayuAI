"use client";

import { useCallback, useEffect, useState } from "react";
import type { FusedWeatherResult } from "@/lib/fusion/schema";
import { useSavedCities, type SavedCity } from "@/lib/store";
import { CitySearch, type CityChoice } from "@/components/CitySearch";
import { TodayHeroCard } from "@/components/TodayHeroCard";
import { ForecastCard } from "@/components/ForecastCard";
import { SourceAgreement } from "@/components/SourceAgreement";
import { AqiCard } from "@/components/AqiCard";
import { AlertList } from "@/components/AlertList";
import { RainfallModule } from "@/components/RainfallModule";
import { AgricultureMode } from "@/components/AgricultureMode";
import { TrendChart } from "@/components/TrendChart";
import { SavedCities } from "@/components/SavedCities";
import { HourlyRain } from "@/components/HourlyRain";

export default function Home() {
  const [data, setData] = useState<FusedWeatherResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const { active, setActive } = useSavedCities();

  const fetchWeather = useCallback(
    async (query: string, choice: CityChoice) => {
      setLoading(true);
      setError(null);
      setActive({
        name: choice.name,
        admin1: choice.admin1,
        latitude: choice.latitude,
        longitude: choice.longitude,
      });
      try {
        const res = await fetch(`/api/weather?q=${encodeURIComponent(query)}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch weather.");
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    [setActive]
  );

  // Load by city name (curated DB lookup).
  const loadCity = useCallback(
    (choice: CityChoice) => fetchWeather(choice.name, choice),
    [fetchWeather]
  );

  // Load by GPS coordinates (browser geolocation or "lat,lon" query).
  const loadByCoords = useCallback(
    async (lat: number, lon: number, label?: string) => {
      const query = `${lat.toFixed(4)},${lon.toFixed(4)}`;
      await fetchWeather(query, {
        name: label ?? query,
        latitude: lat,
        longitude: lon,
      });
    },
    [fetchWeather]
  );

  // Use the browser's geolocation API to detect the user's location.
  const useMyLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        loadByCoords(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        setLocating(false);
        const messages: Record<number, string> = {
          1: "Location permission denied. Search a city instead.",
          2: "Location unavailable. Search a city instead.",
          3: "Location request timed out. Search a city instead.",
        };
        setError(messages[err.code] ?? "Could not get your location.");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }, [loadByCoords]);

  // On first mount: if a saved city exists, load it; otherwise auto-detect location.
  useEffect(() => {
    if (active) {
      loadCity(active);
    } else if (typeof navigator !== "undefined" && navigator.geolocation) {
      useMyLocation();
    }
    // Only run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSavedPick = (city: SavedCity) => {
    loadCity(city);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* ─── Header ─── */}
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            <span className="text-sky-600">Vayu</span>AI
          </h1>
          <p className="text-sm text-slate-500">
            AI-Powered Multi-Source Weather Intelligence for India
          </p>
        </div>
        <div className="flex w-full max-w-md items-center gap-2">
          <div className="flex-1">
            <CitySearch onSelect={loadCity} />
          </div>
          <button
            onClick={useMyLocation}
            disabled={locating}
            title="Use my current location"
            className="flex h-[42px] shrink-0 items-center gap-1.5 rounded-xl bg-sky-600 px-3 text-sm font-medium text-white shadow-card transition hover:bg-sky-700 disabled:opacity-60"
          >
            {locating ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
                <circle cx="12" cy="12" r="3.5" fill="white" />
                <g stroke="white" strokeWidth="1.8">
                  <line x1="12" y1="2" x2="12" y2="6" />
                  <line x1="12" y1="18" x2="12" y2="22" />
                  <line x1="2" y1="12" x2="6" y2="12" />
                  <line x1="18" y1="12" x2="22" y2="12" />
                </g>
              </svg>
            )}
            <span className="hidden sm:inline">{locating ? "Locating…" : "My location"}</span>
          </button>
        </div>
      </header>

      {/* ─── Loading skeleton ─── */}
      {loading && (
        <div className="space-y-4 animate-pulse">
          <div className="card h-72 rounded-2xl bg-slate-200" />
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card h-48 rounded-2xl bg-slate-200" />
            <div className="card h-48 rounded-2xl bg-slate-200" />
            <div className="card h-48 rounded-2xl bg-slate-200" />
          </div>
        </div>
      )}

      {/* ─── Error ─── */}
      {error && !loading && (
        <div className="card p-6 text-center">
          <div className="text-4xl">⚠️</div>
          <h2 className="mt-2 text-lg font-semibold text-red-700">
            Something went wrong
          </h2>
          <p className="mt-1 text-sm text-slate-600">{error}</p>
          <p className="mt-2 text-xs text-slate-400">
            Tip: try a major Indian city (Delhi, Mumbai, Chennai, Kolkata).
          </p>
        </div>
      )}

      {/* ─── Empty state ─── */}
      {!data && !loading && !error && !locating && (
        <div className="card flex flex-col items-center justify-center p-12 text-center">
          <div className="text-6xl">🌤️</div>
          <h2 className="mt-4 text-xl font-semibold text-slate-800">
            Get weather for your location
          </h2>
          <p className="mt-2 max-w-md text-sm text-slate-500">
            Click <strong>“My location”</strong> above to auto-detect where you are,
            or search any Indian city. VayuAI fuses live data from{" "}
            <strong>Open-Meteo</strong>, <strong>wttr.in</strong>, and{" "}
            <strong>7Timer!</strong> using an AI ensemble.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {["Delhi", "Mumbai", "Chennai", "Kolkata", "Bengaluru", "Jaipur"].map(
              (city) => (
                <button
                  key={city}
                  onClick={() => loadCity({ name: city, latitude: 0, longitude: 0 })}
                  className="chip bg-sky-100 text-sky-700 hover:bg-sky-200"
                >
                  {city}
                </button>
              )
            )}
          </div>
        </div>
      )}

      {/* ─── Locating state ─── */}
      {locating && (
        <div className="card flex flex-col items-center justify-center p-12 text-center">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-sky-200 border-t-sky-600" />
          <h2 className="mt-4 text-lg font-semibold text-slate-800">Detecting your location…</h2>
          <p className="mt-1 text-sm text-slate-500">
            Please allow location access in your browser.
          </p>
        </div>
      )}

      {/* ─── Dashboard ─── */}
      {data && !loading && (
        <div className="space-y-6">
          {/* Hero + sidebar */}
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <TodayHeroCard data={data} />
            </div>
            <div className="space-y-4">
              <SavedCities
                current={active}
                activeData={data}
                onPick={handleSavedPick}
              />
              <SourceAgreement
                sourcesUsed={data.sourcesUsed}
                sourcesFailed={data.sourcesFailed}
                rainAgreement={data.today.rainAgreement}
              />
            </div>
          </div>

          {/* 7-day grid */}
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              7-Day Forecast
            </h2>
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
              {data.days.map((day, i) => (
                <ForecastCard key={day.date} day={day} isToday={i === 0} />
              ))}
            </div>
          </div>

          {/* Hourly rain outlook */}
          <HourlyRain hourly={data.hourly} />

          {/* Trend + Rainfall */}
          <div className="grid gap-4 md:grid-cols-2">
            <TrendChart data={data} />
            <RainfallModule data={data} />
          </div>

          {/* Alerts + AQI + Agriculture */}
          <div className="grid gap-4 md:grid-cols-3">
            <AlertList alerts={data.alerts} />
            <AqiCard aqi={data.airQuality} />
            <AgricultureMode data={data} />
          </div>

          {/* Footer attribution */}
          <footer className="pt-4 text-center text-xs text-slate-400">
            Data fused from Open-Meteo · wttr.in · 7Timer! · Open-Meteo Air Quality
            &nbsp;|&nbsp; Confidence, alerts &amp; summaries are AI-generated
            &nbsp;|&nbsp; VayuAI v1.0 MVP
          </footer>
        </div>
      )}
    </div>
  );
}
