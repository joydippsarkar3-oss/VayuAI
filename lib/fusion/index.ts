import type {
  FusedDayForecast,
  FusedWeatherResult,
  RawDayForecast,
  SourceId,
} from "@/lib/fusion/schema";
import { fetchOpenMeteo, fetchOpenMeteoSun, fetchOpenMeteoHourly } from "@/lib/sources/openmeteo";
import { fetchWttr } from "@/lib/sources/wttr";
import { fetchSevenTimer } from "@/lib/sources/seventimer";
import { fetchAirQuality } from "@/lib/sources/airquality";
import { applyBiasCorrection, fuseDay } from "@/lib/fusion/ensemble";
import { confidenceForDay } from "@/lib/fusion/confidence";
import { generateSummary } from "@/lib/summary/templates";
import { evaluateAlerts, type WeatherAlert } from "@/lib/alerts";

export interface CityRef {
  name: string;
  admin1?: string;
  country?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

/**
 * PRD §5.1 orchestration: fetch all sources → normalise → fuse (ensemble) →
 * bias-correct → confidence-score → summary + alerts.
 *
 * Sources are fetched in parallel. If any source fails, fusion continues with the
 * rest (PRD §11 risk mitigation: "6-source redundancy; any 3 sources sufficient").
 */
export async function fuseWeather(city: CityRef): Promise<FusedWeatherResult> {
  const sources: { id: SourceId; fn: () => Promise<RawDayForecast[]> }[] = [
    { id: "openmeteo", fn: () => fetchOpenMeteo(city.latitude, city.longitude) },
    { id: "wttr", fn: () => fetchWttr(city.latitude, city.longitude) },
    { id: "seventimer", fn: () => fetchSevenTimer(city.latitude, city.longitude) },
  ];

  const results = await Promise.allSettled(sources.map((s) => s.fn()));

  const rawBySource: Record<SourceId, RawDayForecast[]> = {
    openmeteo: [],
    wttr: [],
    seventimer: [],
  };
  const sourcesUsed: SourceId[] = [];
  const sourcesFailed: SourceId[] = [];
  results.forEach((r, i) => {
    const id = sources[i].id;
    if (r.status === "fulfilled") {
      rawBySource[id] = r.value;
      sourcesUsed.push(id);
    } else {
      sourcesFailed.push(id);
      console.warn(`[VayuAI] source ${id} failed:`, r.reason?.message ?? r.reason);
    }
  });

  if (sourcesUsed.length === 0) {
    throw new Error(
      "All weather sources are currently unavailable. Please try again shortly."
    );
  }

  // Merge all raws, group by date.
  const allRaws = sourcesUsed.flatMap((s) => rawBySource[s]);
  const byDate = new Map<string, RawDayForecast[]>();
  for (const r of allRaws) {
    if (!byDate.has(r.date)) byDate.set(r.date, []);
    byDate.get(r.date)!.push(r);
  }

  // Order dates ascending and take the next 7 starting from today.
  const todayISO = todayInIST();
  const sortedDates = [...byDate.keys()].sort();
  const upcoming = sortedDates
    .filter((d) => d >= todayISO)
    .slice(0, 7);

  const days: FusedDayForecast[] = upcoming.map((date, idx) => {
    const raws = byDate.get(date) ?? [];
    const base = fuseDay(raws);
    if (!base) return null;
    base.confidence = confidenceForDay(base, raws, idx, sourcesUsed.length);
    return applyBiasCorrection(base, `${city.latitude},${city.longitude}`);
  }).filter((d): d is FusedDayForecast => d !== null);

  // Attach sunrise/sunset to today from Open-Meteo (best source for these).
  const sun =
    sourcesUsed.includes("openmeteo") && days.length
      ? await fetchOpenMeteoSun(city.latitude, city.longitude).catch(() => null)
      : null;
  if (days.length && sun) {
    days[0].sunrise = sun.sunrise;
    days[0].sunset = sun.sunset;
  }

  const today = days[0];
  if (!today) {
    throw new Error("No forecast data is available for today.");
  }

  // AQI (best-effort; null if unavailable).
  const airQuality = await fetchAirQuality(city.latitude, city.longitude).catch(
    (err) => {
      console.warn("[VayuAI] AQI fetch failed:", err?.message ?? err);
      return null;
    }
  );

  // Hourly precipitation for the next 24h (Open-Meteo is the only source with
  // granular hourly data; best-effort — empty array if unavailable).
  const hourly = await fetchOpenMeteoHourly(city.latitude, city.longitude).catch(
    (err) => {
      console.warn("[VayuAI] hourly fetch failed:", err?.message ?? err);
      return [];
    }
  );

  // Alerts across the 7-day window.
  const alerts: WeatherAlert[] = evaluateAlerts(days, city.name);

  // Plain-language summary (templates; optional LLM path inside templates.ts).
  const todaySummary = generateSummary({
    city: city.name,
    day: today,
    region: city.admin1,
    rainAgreement: today.rainAgreement,
    sourcesUsed,
  });

  return {
    city: {
      name: city.name,
      admin1: city.admin1,
      country: city.country ?? "India",
      latitude: city.latitude,
      longitude: city.longitude,
      timezone: "Asia/Kolkata",
    },
    fetchedAt: new Date().toISOString(),
    days,
    today,
    todaySummary,
    hourly,
    airQuality,
    alerts,
    sourcesUsed,
    sourcesFailed,
  };
}

/**
 * Today's date in IST (UTC+5:30), as ISO "YYYY-MM-DD".
 * Computed from UTC by adding the IST offset, independent of the server's timezone.
 */
function todayInIST(): string {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().slice(0, 10);
}
