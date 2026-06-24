/**
 * Common normalised schema — PRD §5.1 Step 1 (Data Ingestion & Normalisation).
 *
 * Every weather source is parsed into `RawDayForecast[]` (one entry per source per day),
 * then the ensemble combines them into `FusedDayForecast` (one fused value per day).
 *
 * Missing values are represented as `null` (the PRD calls these "NaN", handled by the
 * imputation/ensemble layer). We use `null` rather than `NaN` so the values are JSON-safe.
 */

export type SourceId = "openmeteo" | "wttr" | "seventimer";

export const SOURCE_LABELS: Record<SourceId, string> = {
  openmeteo: "Open-Meteo",
  wttr: "wttr.in",
  seventimer: "7Timer!",
};

export const SOURCE_ORDER: SourceId[] = ["openmeteo", "wttr", "seventimer"];

/**
 * A single day's data from ONE source, normalised to the common schema.
 * Numeric fields are `number | null` — null means the source had no value.
 */
export interface RawDayForecast {
  date: string; // ISO date "YYYY-MM-DD"
  source: SourceId;
  tempMax: number | null; // °C
  tempMin: number | null; // °C
  rainfallMm: number | null; // mm/day
  rainProbability: number | null; // %
  humidity: number | null; // %
  windKmh: number | null; // km/h
  uvIndex: number | null; // 0-11+
  cloudCover: number | null; // %
  conditionCode: string | null; // normalised: "clear" | "cloudy" | "rain" | ...
}

/** A single fused day produced by the ensemble. */
export interface FusedDayForecast {
  date: string; // ISO date "YYYY-MM-DD"
  tempMax: number | null;
  tempMin: number | null;
  rainfallMm: number | null;
  rainProbability: number | null;
  humidity: number | null;
  windKmh: number | null;
  uvIndex: number | null;
  cloudCover: number | null;
  conditionCode: string;
  sunrise?: string | null;
  sunset?: string | null;
  /** 0-100, derived from inter-source agreement + freshness (PRD Step 5). */
  confidence: number;
  /** Per-field contribution: which sources had a value for each metric. */
  sources: Record<string, SourceId[]>;
  /** Whether rain is predicted (>= 1 source says rain). */
  rainAgreement: { agree: number; total: number };
}

export interface AirQuality {
  pm25: number | null; // µg/m³
  usAqi: number | null; // US EPA AQI (open-meteo uses US scale)
  indiaAqi: number | null; // approximated to CPCB band
  category: string; // "Good" | "Moderate" | ... health advisory band
  advisory: string;
  source: string;
}

/** Hourly precipitation/temperature — hour-by-hour rain outlook. */
export interface HourlyPrecip {
  time: string; // ISO "YYYY-MM-DDTHH:MM"
  precipMm: number;
  precipProb: number; // %
  temp: number; // °C
  humidity: number; // %
  windKmh: number;
  conditionCode: string;
}

export interface FusedWeatherResult {
  city: {
    name: string;
    admin1?: string;
    country?: string;
    latitude: number;
    longitude: number;
    timezone: string;
  };
  fetchedAt: string; // ISO timestamp
  days: FusedDayForecast[];
  today: FusedDayForecast;
  todaySummary: string;
  /** Hourly precipitation + temp for the next 24 hours (from Open-Meteo). */
  hourly: HourlyPrecip[];
  airQuality: AirQuality | null;
  alerts: WeatherAlert[];
  sourcesUsed: SourceId[]; // sources that actually returned data
  sourcesFailed: SourceId[]; // sources that errored / timed out
}

/* ── Alert types (also re-exported from lib/alerts.ts) ────────────────── */

export type AlertSeverity = "info" | "warning" | "severe";

export interface WeatherAlert {
  id: string;
  type:
    | "heavy-rain"
    | "extreme-heat"
    | "cold-wave"
    | "thunderstorm"
    | "high-wind"
    | "high-uv";
  severity: AlertSeverity;
  title: string;
  message: string;
  date: string; // ISO date the alert triggers
  dayLabel: string; // e.g. "Today", "Tomorrow", weekday
}
