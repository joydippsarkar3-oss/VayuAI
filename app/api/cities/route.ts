import { NextResponse } from "next/server";
import { searchCuratedCities } from "@/lib/cities";
import { citiesCache } from "@/lib/cache";

/**
 * GET /api/cities?q=<partial name>
 *
 * City search. Uses the curated India DB for instant results, and falls back to
 * the keyless Open-Meteo geocoding API for arbitrary queries (e.g. small towns
 * not in the curated list). Results are filtered to India and TTL-cached.
 */

const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";

interface GeoResult {
  name: string;
  admin1?: string;
  country?: string;
  country_code?: string;
  latitude: number;
  longitude: number;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q) {
    return NextResponse.json(
      { error: "Missing required query parameter 'q'." },
      { status: 400 }
    );
  }

  const cacheKey = q.toLowerCase();
  const cached = citiesCache.get(cacheKey);
  if (cached) {
    return NextResponse.json({ cities: cached, cached: true });
  }

  // 1. Curated matches first (instant, guaranteed India).
  const local = searchCuratedCities(q, 10);

  // 2. Augment with Open-Meteo geocoding for breadth (keyless).
  let remote: GeoResult[] = [];
  try {
    const url = `${GEOCODE_URL}?name=${encodeURIComponent(
      q
    )}&count=10&language=en&format=json`;
    const res = await fetch(url, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      remote = (data?.results ?? []).filter(
        (r: GeoResult) => r.country_code === "IN"
      );
    }
  } catch (err) {
    console.warn("[VayuAI] geocoding fallback failed:", (err as Error).message);
  }

  // Merge, dedupe by name+state, prefer curated entries, cap at 12.
  const seen = new Set<string>();
  const merged = [...local.map(toGeo), ...remote]
    .filter((c) => {
      const key = `${c.name.toLowerCase()}|${(c.admin1 ?? "").toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 12);

  citiesCache.set(cacheKey, merged);
  return NextResponse.json({ cities: merged, cached: false });
}

function toGeo(c: ReturnType<typeof searchCuratedCities>[number]): GeoResult {
  return {
    name: c.name,
    admin1: c.admin1,
    country: "India",
    country_code: "IN",
    latitude: c.latitude,
    longitude: c.longitude,
  };
}

export const dynamic = "force-dynamic";
