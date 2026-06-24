import type { FusedDayForecast, RawDayForecast, SourceId } from "@/lib/fusion/schema";

/**
 * Confidence scoring — PRD §5.1 Step 5.
 *
 * Each daily forecast gets a Confidence Score (0-100) based on:
 *   1. Inter-source agreement (low variance between sources → higher confidence)
 *   2. Source coverage (more sources reporting → higher confidence)
 *   3. Forecast horizon (today/near days → higher confidence than day 7)
 *
 * PRD: Score < 50 → displayed with a warning icon ("Low confidence, check back later").
 */

const NUMERIC_FIELDS = ["tempMax", "tempMin", "rainfallMm", "humidity", "windKmh"] as const;

/** Compute confidence for a fused day given its contributing raw values. */
export function confidenceForDay(
  fused: FusedDayForecast,
  raws: RawDayForecast[],
  horizonDays: number,
  maxSources: number
): number {
  let score = 100;

  // --- 1. Inter-source agreement -------------------------------------------------
  // For each numeric field, penalise spread (normalised mean absolute deviation).
  const agreement = fieldAgreement(raws);
  score -= (1 - agreement) * 45; // up to -45 points for disagreement

  // --- 2. Source coverage -------------------------------------------------------
  // Fewer sources → less reliable. Days where some sources return null (e.g. wttr's
  // 3-day horizon) get less coverage.
  const sourceCount = new Set(raws.map((r) => r.source)).size;
  if (maxSources > 0) {
    const coverage = sourceCount / maxSources; // 0..1
    score -= (1 - coverage) * 25; // up to -25 for missing sources
  }

  // --- 3. Forecast horizon ------------------------------------------------------
  // Further-out days are inherently less certain.
  const horizonPenalty = Math.min(horizonDays, 6) * 4; // 0,4,8,...,24
  score -= horizonPenalty;

  // --- 4. Rain-specific uncertainty ---------------------------------------------
  // If sources split on rain (some say rain, some don't), drop confidence further.
  const { agree, total } = fused.rainAgreement;
  if (total > 1) {
    const rainSplit = Math.min(agree, total - agree) / total; // 0 = unanimous, ~0.5 = split
    score -= rainSplit * 10;
  }

  return clamp(Math.round(score), 0, 100);
}

/**
 * Returns a 0..1 score for how closely the numeric fields agree across sources.
 * Uses normalised spread: 1 = perfect agreement, 0 = maximally disagreeing.
 */
function fieldAgreement(raws: RawDayForecast[]): number {
  if (raws.length < 2) return 1;
  let totalPenalty = 0;
  let fields = 0;
  for (const field of NUMERIC_FIELDS) {
    const values = raws
      .map((r) => r[field])
      .filter((v): v is number => v !== null && v !== undefined && !Number.isNaN(v));
    if (values.length < 2) continue;
    fields++;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const spread =
      values.reduce((a, b) => a + Math.abs(b - mean), 0) / values.length;
    // Normalise spread by field scale; if mean~0 (no rain) use absolute tolerance.
    const norm = mean !== 0 ? spread / Math.abs(mean) : spread / 5;
    totalPenalty += clamp(norm, 0, 1);
  }
  if (fields === 0) return 1;
  const avgPenalty = totalPenalty / fields;
  return clamp(1 - avgPenalty, 0, 1);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export function isLowConfidence(score: number): boolean {
  return score < 50;
}
