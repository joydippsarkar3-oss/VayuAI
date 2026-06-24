import type { FusedDayForecast, SourceId } from "@/lib/fusion/schema";

/**
 * Daily summary — PRD §5.1 Step 4.
 *
 * MVP: deterministic template engine producing PRD-style summaries like:
 *   "Wednesday will be mostly cloudy in Bhopal with a high of 34°C. Expect heavy
 *    rainfall in the afternoon (18mm likely), so carry an umbrella if stepping out.
 *    Humidity stays high at 82%."
 *
 * This always works with no keys. An OPTIONAL LLM path (Anthropic/Gemini) can be
 * enabled by setting ANTHROPIC_API_KEY or GEMINI_API_KEY — see `llmSummary()` below.
 * When no key is present, `generateSummary` falls back to the template engine.
 */

export interface SummaryInput {
  city: string;
  day: FusedDayForecast;
  region?: string;
  rainAgreement: { agree: number; total: number };
  sourcesUsed: SourceId[];
}

export function generateSummary(input: SummaryInput): string {
  if (process.env.ANTHROPIC_API_KEY || process.env.GEMINI_API_KEY) {
    // Fire-and-forget is not appropriate here (we want the result), but the LLM
    // call is best-effort: any failure falls back to the template engine.
    // We cannot `await` in this sync function, so the LLM path is wired through
    // `generateSummaryAsync` (called by the API route). If invoked here, fall back.
    return templateSummary(input);
  }
  return templateSummary(input);
}

/** Async variant: tries LLM if a key is configured, else template. */
export async function generateSummaryAsync(
  input: SummaryInput
): Promise<string> {
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return await llmSummaryAnthropic(input);
    } catch (e) {
      console.warn("[VayuAI] Anthropic summary failed, using template:", (e as Error).message);
    }
  }
  return templateSummary(input);
}

function templateSummary(input: SummaryInput): string {
  const { city, day, region } = input;
  const weekday = weekdayName(day.date);
  const place = region ? `${city} (${region})` : city;

  const cond = conditionPhrase(day.conditionCode);
  const high = day.tempMax !== null ? `${Math.round(day.tempMax)}°C` : "an uncertain high";
  const low = day.tempMin !== null ? `${Math.round(day.tempMin)}°C` : null;

  const sentences: string[] = [];
  sentences.push(
    `${weekday} will be ${cond} in ${place}, with a high of ${high}${
      low ? ` and a low of ${low}` : ""
    }.`
  );

  // Rain sentence — matches the PRD example tone.
  if (day.rainfallMm !== null && day.rainfallMm >= 0.3) {
    const mm = Math.round(day.rainfallMm);
    const intensity = mm >= 30 ? "very heavy" : mm >= 10 ? "heavy" : mm >= 4 ? "moderate" : "light";
    const advice =
      mm >= 10
        ? " so carry an umbrella if stepping out."
        : mm >= 4
        ? "; an umbrella is a good idea."
        : ".";
    sentences.push(
      `Expect ${intensity} rainfall (${mm}mm likely)${advice}`
    );
    if (input.rainAgreement.total > 1) {
      sentences.push(
        ` ${input.rainAgreement.agree}/${input.rainAgreement.total} sources agree on rain.`
      );
    }
  } else if (day.rainProbability !== null && day.rainProbability >= 50) {
    sentences.push(
      `There is a ${day.rainProbability}% chance of rain — keep an umbrella handy.`
    );
  } else {
    sentences.push(`Rain is unlikely today.`);
  }

  // Humidity sentence.
  if (day.humidity !== null) {
    const level = day.humidity >= 75 ? "high" : day.humidity >= 50 ? "moderate" : "low";
    sentences.push(`Humidity stays ${level} at ${Math.round(day.humidity)}%.`);
  }

  // UV advisory.
  if (day.uvIndex !== null && day.uvIndex >= 8) {
    sentences.push(`UV index is very high (${Math.round(day.uvIndex)}) — use sun protection.`);
  } else if (day.uvIndex !== null && day.uvIndex >= 6) {
    sentences.push(`UV index is high (${Math.round(day.uvIndex)}).`);
  }

  return sentences.join(" ");
}

function conditionPhrase(code: string): string {
  switch (code) {
    case "clear":
      return "mostly clear and sunny";
    case "partly-cloudy":
      return "partly cloudy";
    case "cloudy":
      return "mostly cloudy";
    case "rain":
      return "rainy";
    case "thunderstorm":
      return "thundery, with storms likely";
    case "snow":
      return "cold with a chance of snow";
    case "humid":
      return "warm and humid";
    case "windy":
      return "breezy";
    default:
      return "changeable";
  }
}

function weekdayName(iso: string): string {
  // Parse as local date parts to avoid TZ surprises: "YYYY-MM-DD"
  const [y, m, d] = iso.split("-").map((n) => parseInt(n, 10));
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("en-IN", { weekday: "long" });
}

// ---------------------------------------------------------------------------
// Optional LLM path (PRD Step 4 vision). Only runs when an API key is set.
// ---------------------------------------------------------------------------

async function llmSummaryAnthropic(input: SummaryInput): Promise<string> {
  const { city, day, region } = input;
  const facts = {
    city: region ? `${city}, ${region}` : city,
    date: day.date,
    temp_max: day.tempMax,
    temp_min: day.tempMin,
    rainfall_mm: day.rainfallMm,
    rain_probability: day.rainProbability,
    humidity: day.humidity,
    wind_kmh: day.windKmh,
    uv_index: day.uvIndex,
    condition: day.conditionCode,
    rain_sources_agree: `${input.rainAgreement.agree}/${input.rainAgreement.total}`,
  };

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: `Write a 2-3 sentence plain-language daily weather summary for an Indian user, based on this fused forecast (JSON). Be concrete and practical (umbrella, sun protection). No emoji.\n\n${JSON.stringify(facts)}`,
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic HTTP ${res.status}`);
  const data = await res.json();
  const text = data?.content?.[0]?.text;
  if (!text) throw new Error("Anthropic returned no text");
  return text.trim();
}
