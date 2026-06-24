import { NextResponse } from "next/server";
import { fuseWeather, type CityRef } from "@/lib/fusion";
import { findCuratedCity } from "@/lib/cities";
import { weatherCache } from "@/lib/cache";

/**
 * GET /api/weather?q=<city name or "lat,lon">
 *
 * Acts as the PRD's API Gateway + AEFE pipeline in one call:
 * resolves the city, fetches all sources, fuses them, scores confidence,
 * generates a summary, evaluates alerts, and returns the fused result.
 *
 * Results are TTL-cached (5 min) to respect free-tier rate limits (PRD §7.1, §8).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q) {
    return NextResponse.json(
      { error: "Missing required query parameter 'q' (city name or 'lat,lon')." },
      { status: 400 }
    );
  }

  const city = resolveCity(q);
  if (!city) {
    return NextResponse.json(
      { error: `Could not resolve city "${q}". Try a major Indian city name.` },
      { status: 404 }
    );
  }

  const cacheKey = `${city.latitude.toFixed(3)},${city.longitude.toFixed(3)}`;
  const cached = weatherCache.get(cacheKey);
  if (cached) {
    return NextResponse.json({ ...cached, cached: true });
  }

  try {
    const result = await fuseWeather(city);
    // Cache a fully-successful result for the full TTL. If a non-critical piece
    // (e.g. AQI) failed transiently, cache only briefly so the next request retries.
    const partial =
      result.airQuality === null || result.sourcesFailed.length > 0;
    weatherCache.set(cacheKey, result, partial ? 60 * 1000 : undefined); // 1 min vs 5 min
    return NextResponse.json({ ...result, cached: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[VayuAI] /api/weather error:", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

function resolveCity(q: string): CityRef | null {
  // "lat,lon" form
  const coordMatch = q.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
  if (coordMatch) {
    const latitude = parseFloat(coordMatch[1]);
    const longitude = parseFloat(coordMatch[2]);
    return { name: `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`, latitude, longitude };
  }
  // Curated India DB
  const entry = findCuratedCity(q);
  if (entry) {
    return {
      name: entry.name,
      admin1: entry.admin1,
      latitude: entry.latitude,
      longitude: entry.longitude,
    };
  }
  return null;
}

export const dynamic = "force-dynamic";
