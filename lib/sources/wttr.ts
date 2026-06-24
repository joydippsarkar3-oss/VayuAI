import type { RawDayForecast } from "@/lib/fusion/schema";

/**
 * wttr.in source connector — keyless, unlimited.
 * PRD §13: https://wttr.in/{city}?format=j1
 * Gives 3 days of: temp, feels-like, rain mm, cloud cover, weather condition code.
 *
 * wttr.in's city geocoding can be flaky for Indian tier-3 towns, so we pass lat,lon
 * explicitly (wttr.in accepts lat,lon in the query string).
 */

interface WttrHourly {
  tempC: string;
  humidity: string;
  windspeedKmph: string;
  chanceofrain: string;
  precipMM: string;
  uvIndex: string;
}
interface WttrDay {
  date: string; // epoch-ish string
  maxtempC: string;
  mintempC: string;
  avgtempC: string;
  // total precip across the day (sum of hourly) is computed; wttr gives hourly precipMM
  totalSnow_cm: string;
  sunHour: string;
  uvIndex: string;
  hourly: WttrHourly[];
}
interface WttrResponse {
  weather: WttrDay[];
  current_condition?: Array<{
    cloudcover: string;
    weatherDesc: Array<{ value: string }>;
    weatherCode: string;
  }>;
  error?: Array<{ desc: string }>;
}

export async function fetchWttr(lat: number, lon: number): Promise<RawDayForecast[]> {
  // wttr.in accepts "?format=j1" with a lat,lon location query
  const url = `https://wttr.in/${formatCoord(lat)},${formatCoord(
    lon
  )}?format=j1&lang=en`;
  const res = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/json", "Accept-Language": "en" },
  });
  if (!res.ok) {
    throw new Error(`wttr.in HTTP ${res.status}`);
  }
  const data = (await res.json()) as WttrResponse;
  if (data.error) {
    throw new Error(`wttr.in error: ${data.error[0]?.desc ?? "unknown"}`);
  }

  const out: RawDayForecast[] = [];
  for (const day of data.weather ?? []) {
    const iso = isoFromWttrDate(day.date);
    // Sum hourly precipitation for the day total
    const totalPrecip = day.hourly.reduce(
      (sum, h) => sum + (parseFloat(h.precipMM) || 0),
      0
    );
    // Average cloud cover / humidity / chanceofrain across the day's hours
    const avg = (sel: (h: WttrHourly) => number) =>
      day.hourly.length
        ? day.hourly.reduce((s, h) => s + (parseFloat(sel(h) as unknown as string) || 0), 0) /
          day.hourly.length
        : 0;

    const maxWind = Math.max(
      ...day.hourly.map((h) => parseFloat(h.windspeedKmph) || 0)
    );

    out.push({
      date: iso,
      source: "wttr",
      tempMax: numOrNull(parseFloat(day.maxtempC)),
      tempMin: numOrNull(parseFloat(day.mintempC)),
      rainfallMm: round1(totalPrecip),
      rainProbability: Math.round(avg((h) => parseFloat(h.chanceofrain))),
      humidity: Math.round(avg((h) => parseFloat(h.humidity))),
      windKmh: Math.round(maxWind),
      uvIndex: numOrNull(parseFloat(day.uvIndex)),
      cloudCover: null, // wttr gives cloudcover per hour; skip to avoid noise
      conditionCode: conditionFromWttr(day.hourly, totalPrecip),
    });
  }
  return out;
}

function numOrNull(v: number): number | null {
  return Number.isNaN(v) ? null : v;
}

function round1(v: number): number | null {
  if (Number.isNaN(v)) return null;
  return Math.round(v * 10) / 10;
}

/** wttr returns date as "YYYY-M-D" (zero-unpadded). Normalise to ISO. */
function isoFromWttrDate(d: string): string {
  const [y, m, day] = d.split("-").map((n) => parseInt(n, 10));
  if (!y || !m || !day) return d;
  return `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function conditionFromWttr(hourly: WttrHourly[], precip: number): string {
  if (precip >= 0.3) return "rain";
  // Look at weatherCode in the descriptions — but hourly only has limited fields,
  // so infer from chance of rain.
  const avgChance = hourly.length
    ? hourly.reduce((s, h) => s + (parseFloat(h.chanceofrain) || 0), 0) / hourly.length
    : 0;
  if (avgChance >= 50) return "rain";
  if (avgChance >= 20) return "partly-cloudy";
  return "clear";
}

function formatCoord(v: number): string {
  return v.toFixed(4).replace(/\.?0+$/, "").replace(/-0$/, "0");
}
