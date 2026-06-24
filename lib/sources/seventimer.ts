import type { RawDayForecast } from "@/lib/fusion/schema";

/**
 * 7Timer! source connector — keyless, unlimited.
 * PRD §13: http://www.7timer.info/bin/civillight.php?lon={lon}&lat={lat}&output=json
 * Gives 7 days of: temp max/min, weather code, wind (Beaufort).
 *
 * 7Timer! serves over HTTP only (no HTTPS), which is fine — we fetch server-side.
 * It returns limited fields (no humidity/UV/rain-probability), so those stay null
 * for this source — the ensemble still fuses the fields 7Timer does provide.
 */

const SEVENTIMER_URL = "http://www.7timer.info/bin/civillight.php";

// 7Timer! "weather" codes (civillight product) → normalised condition
const WEATHER_MAP: Record<string, string> = {
  clear: "clear",
  pcloudy: "partly-cloudy",
  mcloudy: "cloudy",
  cloudy: "cloudy",
  humid: "humid",
  lightrain: "rain",
  oshower: "rain",
  ishower: "rain",
  lightsnow: "snow",
  rain: "rain",
  ts: "thunderstorm",
  tsrain: "thunderstorm",
  wind: "windy",
};

interface SevenTimerResponse {
  product?: string;
  dataseries?: Array<{
    date: number; // YYYYMMDD
    weather: string;
    temp2m: { max: number; min: number };
    wind10m_max: number; // Beaufort scale
  }>;
}

export async function fetchSevenTimer(
  lat: number,
  lon: number
): Promise<RawDayForecast[]> {
  const url = `${SEVENTIMER_URL}?lon=${lon}&lat=${lat}&ac=0&unit=metric&output=json`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`7Timer! HTTP ${res.status}`);
  }
  const data = (await res.json()) as SevenTimerResponse;
  if (!data.dataseries) {
    throw new Error("7Timer! returned no dataseries");
  }

  const out: RawDayForecast[] = [];
  for (const d of data.dataseries) {
    out.push({
      date: isoFrom7TimerDate(d.date),
      source: "seventimer",
      tempMax: d.temp2m.max,
      tempMin: d.temp2m.min,
      rainfallMm: null, // 7Timer civillight has no mm value
      rainProbability: null,
      humidity: null,
      windKmh: beaufortToKmh(d.wind10m_max),
      uvIndex: null,
      cloudCover: null,
      conditionCode: WEATHER_MAP[d.weather] ?? "clear",
    });
  }
  return out;
}

/** 7Timer encodes dates as YYYYMMDD integers (e.g. 20260620). */
function isoFrom7TimerDate(n: number): string {
  const s = String(n);
  if (s.length !== 8) return s;
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

/** Convert Beaufort scale (0-12) to an approximate km/h range midpoint. */
function beaufortToKmh(beaufort: number): number | null {
  // Standard Beaufort → km/h upper bounds; we take the midpoint of the band.
  const bounds = [1, 6, 11, 19, 28, 38, 49, 61, 74, 88, 102, 117];
  const b = Math.max(0, Math.min(12, beaufort));
  if (b === 0) return 0;
  const upper = bounds[b - 1] ?? 0;
  const lower = b === 1 ? 0 : bounds[b - 2] ?? 0;
  return Math.round((upper + lower) / 2);
}
