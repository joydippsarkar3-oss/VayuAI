import type { RawDayForecast } from "@/lib/fusion/schema";

/**
 * Open-Meteo source connector — keyless, unlimited non-commercial.
 * PRD §13: https://api.open-meteo.com/v1/forecast
 * Gives 7 days of: temp max/min, precip mm, precip prob, wind, humidity, UV, sunrise/sunset.
 */

const OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast";

const FIELDS = [
  "temperature_2m_max",
  "temperature_2m_min",
  "precipitation_sum",
  "precipitation_probability_max",
  "wind_speed_10m_max",
  "relative_humidity_2m_max",
  "uv_index_max",
  "cloud_cover_mean",
].join(",");

interface OpenMeteoResponse {
  daily?: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    precipitation_probability_max: number[];
    wind_speed_10m_max: number[];
    relative_humidity_2m_max: number[];
    uv_index_max: number[];
    cloud_cover_mean?: number[];
  };
  error?: boolean;
  reason?: string;
}

export async function fetchOpenMeteo(
  lat: number,
  lon: number
): Promise<RawDayForecast[]> {
  const url =
    `${OPEN_METEO_URL}?latitude=${lat}&longitude=${lon}` +
    `&daily=${FIELDS}&timezone=Asia/Kolkata&forecast_days=7`;

  const res = await fetch(url, {
    // Cache fresh data per request in dev; the API route layer TTL-caches results.
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Open-Meteo HTTP ${res.status}`);
  }
  const data = (await res.json()) as OpenMeteoResponse;
  if (data.error || !data.daily) {
    throw new Error(`Open-Meteo error: ${data.reason ?? "no daily data"}`);
  }

  const d = data.daily;
  const out: RawDayForecast[] = [];
  for (let i = 0; i < d.time.length; i++) {
    out.push({
      date: d.time[i],
      source: "openmeteo",
      tempMax: numOrNull(d.temperature_2m_max[i]),
      tempMin: numOrNull(d.temperature_2m_min[i]),
      rainfallMm: numOrNull(d.precipitation_sum[i]),
      rainProbability: numOrNull(d.precipitation_probability_max[i]),
      humidity: numOrNull(d.relative_humidity_2m_max[i]),
      windKmh: numOrNull(d.wind_speed_10m_max[i]),
      uvIndex: numOrNull(d.uv_index_max[i]),
      cloudCover: d.cloud_cover_mean ? numOrNull(d.cloud_cover_mean[i]) : null,
      conditionCode: conditionFromOpenMeteo(
        d.precipitation_sum[i],
        d.cloud_cover_mean?.[i]
      ),
    });
  }
  return out;
}

function numOrNull(v: number | undefined | null): number | null {
  if (v === undefined || v === null || Number.isNaN(v)) return null;
  return v;
}

function conditionFromOpenMeteo(
  precip: number | undefined,
  cloud: number | undefined
): string {
  if ((precip ?? 0) >= 0.3) return "rain";
  if ((cloud ?? 0) >= 70) return "cloudy";
  if ((cloud ?? 0) >= 30) return "partly-cloudy";
  return "clear";
}

/** Hourly precipitation record from Open-Meteo. */
export interface HourlyPrecip {
  time: string; // ISO "YYYY-MM-DDTHH:MM"
  precipMm: number;
  precipProb: number; // %
  temp: number; // °C
  humidity: number; // %
  windKmh: number;
  conditionCode: string;
}

const HOURLY_FIELDS = [
  "precipitation",
  "precipitation_probability",
  "temperature_2m",
  "relative_humidity_2m",
  "wind_speed_10m",
  "cloud_cover",
].join(",");

interface OpenMeteoHourlyResponse {
  hourly?: {
    time: string[];
    precipitation: number[];
    precipitation_probability: number[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
    wind_speed_10m: number[];
    cloud_cover: number[];
  };
  error?: boolean;
  reason?: string;
}

/** Fetch 24-hour hourly data (today + tomorrow). */
export async function fetchOpenMeteoHourly(
  lat: number,
  lon: number
): Promise<HourlyPrecip[]> {
  const url =
    `${OPEN_METEO_URL}?latitude=${lat}&longitude=${lon}` +
    `&hourly=${HOURLY_FIELDS}&timezone=Asia/Kolkata&forecast_days=2`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Open-Meteo hourly HTTP ${res.status}`);
  const data = (await res.json()) as OpenMeteoHourlyResponse;
  if (data.error || !data.hourly) throw new Error(`Open-Meteo hourly: ${data.reason ?? "no data"}`);

  const h = data.hourly;
  const out: HourlyPrecip[] = [];
  // Take only the next 24 hours from now in IST.
  const istNow = new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 13);
  let count = 0;
  for (let i = 0; i < h.time.length && count < 24; i++) {
    const hourSlot = h.time[i].slice(0, 13);
    if (hourSlot < istNow) continue;
    out.push({
      time: h.time[i],
      precipMm: round1(h.precipitation[i]),
      precipProb: Math.round(h.precipitation_probability[i]),
      temp: Math.round(h.temperature_2m[i] * 10) / 10,
      humidity: Math.round(h.relative_humidity_2m[i]),
      windKmh: Math.round(h.wind_speed_10m[i]),
      conditionCode: conditionFromOpenMeteo(h.precipitation[i], h.cloud_cover[i]),
    });
    count++;
  }
  return out;
}

function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

export interface OpenMeteoCurrentConditions {
  sunrise: string | null;
  sunset: string | null;
}

/** Fetch sunrise/sunset separately so the fused "today" can carry them. */
export async function fetchOpenMeteoSun(
  lat: number,
  lon: number
): Promise<OpenMeteoCurrentConditions> {
  const url =
    `${OPEN_METEO_URL}?latitude=${lat}&longitude=${lon}` +
    `&daily=sunrise,sunset&timezone=Asia/Kolkata&forecast_days=1`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return { sunrise: null, sunset: null };
  const data = await res.json();
  return {
    sunrise: data.daily?.sunrise?.[0] ?? null,
    sunset: data.daily?.sunset?.[0] ?? null,
  };
}
