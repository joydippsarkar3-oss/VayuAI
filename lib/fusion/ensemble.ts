import type {
  FusedDayForecast,
  RawDayForecast,
  SourceId,
} from "@/lib/fusion/schema";

/**
 * Weighted ensemble — PRD §5.1 Step 2.
 *
 * Final value for each parameter = Σ (source_value × source_weight) / Σ weights
 * over the NON-NULL sources only.
 *
 * MVP uses equal weights (PRD Phase 1: "equal weights initially"). The weight
 * function is the single place to upgrade to dynamic per-city/per-season weights
 * in Phase 2 (PRD: "Each source is assigned a dynamic weight based on its
 * historical accuracy per city and per season").
 */

/** Weight per source. Equal in Phase 1; upgrade here in Phase 2. */
export function sourceWeight(_source: SourceId, _date: string): number {
  return 1.0;
}

const NUMERIC_FIELDS = [
  "tempMax",
  "tempMin",
  "rainfallMm",
  "rainProbability",
  "humidity",
  "windKmh",
  "uvIndex",
  "cloudCover",
] as const;

type NumericField = (typeof NUMERIC_FIELDS)[number];

/**
 * Fuse all raw day-forecasts for one date into a single fused day.
 */
export function fuseDay(raws: RawDayForecast[]): FusedDayForecast | null {
  if (raws.length === 0) return null;

  const date = raws[0].date;
  const sources = raws.map((r) => r.source);
  const sourcesField: Record<string, SourceId[]> = {};

  const fused: Record<string, number | null> = {};
  for (const field of NUMERIC_FIELDS) {
    const { value, contributors } = weightedMean(raws, field);
    fused[field] = value;
    sourcesField[field] = contributors;
  }

  // Condition code: majority vote among sources, fallback to "clear".
  const conditionCode = voteCondition(raws);

  // Rain agreement: how many sources predict rain (mm >= 0.3 or high prob).
  const rainSources = raws.filter((r) => predictsRain(r));
  const rainAgreement = { agree: rainSources.length, total: raws.length };

  return {
    date,
    tempMax: fused.tempMax,
    tempMin: fused.tempMin,
    rainfallMm: fused.rainfallMm,
    rainProbability: fused.rainProbability,
    humidity: fused.humidity,
    windKmh: fused.windKmh,
    uvIndex: fused.uvIndex,
    cloudCover: fused.cloudCover,
    conditionCode,
    confidence: 0, // filled in by confidence layer
    sources: sourcesField,
    rainAgreement,
  };
}

function weightedMean(
  raws: RawDayForecast[],
  field: NumericField
): { value: number | null; contributors: SourceId[] } {
  let weightSum = 0;
  let weightedSum = 0;
  const contributors: SourceId[] = [];
  for (const r of raws) {
    const v = r[field];
    if (v === null || v === undefined || Number.isNaN(v)) continue;
    const w = sourceWeight(r.source, r.date);
    weightSum += w;
    weightedSum += v * w;
    contributors.push(r.source);
  }
  if (weightSum === 0) return { value: null, contributors };
  const value = Math.round((weightedSum / weightSum) * 10) / 10;
  return { value, contributors };
}

function voteCondition(raws: RawDayForecast[]): string {
  const counts: Record<string, number> = {};
  for (const r of raws) {
    if (!r.conditionCode) continue;
    counts[r.conditionCode] = (counts[r.conditionCode] ?? 0) + 1;
  }
  let best = "clear";
  let bestN = -1;
  for (const [code, n] of Object.entries(counts)) {
    // Prefer more-severe conditions on ties (rain beats clear) for safety.
    if (n > bestN || (n === bestN && severity(code) > severity(best))) {
      best = code;
      bestN = n;
    }
  }
  return best;
}

function severity(code: string): number {
  const order: Record<string, number> = {
    clear: 0,
    "partly-cloudy": 1,
    cloudy: 2,
    humid: 2,
    windy: 2,
    rain: 4,
    snow: 4,
    thunderstorm: 5,
  };
  return order[code] ?? 0;
}

function predictsRain(r: RawDayForecast): boolean {
  if (r.rainfallMm !== null && r.rainfallMm >= 0.3) return true;
  if (r.rainProbability !== null && r.rainProbability >= 50) return true;
  if (r.conditionCode === "rain" || r.conditionCode === "thunderstorm") return true;
  return false;
}

/**
 * Bias correction — PRD §5.1 Step 3 (XGBoost per city).
 *
 * MVP: no-op pass-through. The PRD specifies per-city XGBoost models trained on
 * a rolling 90-day window of forecast-vs-actuals. That requires ground-truth
 * ingestion (IMD actuals) and a training pipeline, which are Phase 2 work.
 * This stub is the single seam where Step 3 plugs in — keep the signature stable.
 */
export function applyBiasCorrection(
  day: FusedDayForecast,
  _cityId: string
): FusedDayForecast {
  // TODO(Phase 2): apply learned per-city bias offsets per field here.
  // Example intended behaviour:
  //   day.tempMax = round((day.tempMax ?? 0) + biasOffset(cityId, 'tempMax'), 1)
  return day;
}
