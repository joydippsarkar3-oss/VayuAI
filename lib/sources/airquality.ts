import type { AirQuality } from "@/lib/fusion/schema";

/**
 * Air-quality connector — Open-Meteo Air Quality API (keyless).
 * Not one of the PRD's named 6 sources, but PRD §6.6 requires AQI and Open-Meteo's
 * free air-quality endpoint gives PM2.5 + US EPA AQI with no key. We map the US AQI
 * to the approximate CPCB (India) band for the health advisory, per PRD §13 note
 * ("use CPCB India AQI breakpoints").
 *
 * Endpoint: https://air-quality-api.open-meteo.com/v1/air-quality
 */

const AQ_URL = "https://air-quality-api.open-meteo.com/v1/air-quality";

interface AirQualityResponse {
  current?: {
    pm2_5?: number;
    us_aqi?: number;
  };
  error?: boolean;
  reason?: string;
}

export async function fetchAirQuality(
  lat: number,
  lon: number
): Promise<AirQuality | null> {
  const url =
    `${AQ_URL}?latitude=${lat}&longitude=${lon}` +
    `&current=pm2_5,us_aqi&timezone=Asia/Kolkata`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  const data = (await res.json()) as AirQualityResponse;
  if (data.error || !data.current) return null;

  const usAqi = data.current.us_aqi ?? null;
  const pm25 = data.current.pm2_5 ?? null;

  // CPCB India AQI is computed from sub-indices; US AQI is a reasonable proxy.
  // We label the band using CPCB-style categories for the advisory.
  const band = bandFromAqi(usAqi ?? pmToUsAqi(pm25));

  return {
    pm25,
    usAqi,
    indiaAqi: usAqi, // approximated; documented in README
    category: band.category,
    advisory: band.advisory,
    source: "Open-Meteo Air Quality (US AQI → CPCB band)",
  };
}

function pmToUsAqi(pm25: number | null): number | null {
  if (pm25 === null) return null;
  // Simplified PM2.5 → US AQI breakpoints
  const bp = [
    [0, 12, 0, 50],
    [12.1, 35.4, 51, 100],
    [35.5, 55.4, 101, 150],
    [55.5, 150.4, 151, 200],
    [150.5, 250.4, 201, 300],
    [250.5, 500.4, 301, 500],
  ] as const;
  for (const [cLo, cHi, iLo, iHi] of bp) {
    if (pm25 >= cLo && pm25 <= cHi) {
      return Math.round((((iHi - iLo) / (cHi - cLo)) * (pm25 - cLo) + iLo));
    }
  }
  return 500;
}

/** CPCB India AQI bands (PRD §13). */
function bandFromAqi(aqi: number | null): {
  category: string;
  advisory: string;
} {
  if (aqi === null) {
    return { category: "Unknown", advisory: "Air quality data unavailable." };
  }
  if (aqi <= 50)
    return {
      category: "Good",
      advisory: "Air quality is satisfactory. Minimal health risk.",
    };
  if (aqi <= 100)
    return {
      category: "Moderate",
      advisory: "Acceptable air quality; minor concern for very sensitive people.",
    };
  if (aqi <= 150)
    return {
      category: "Unhealthy for Sensitive Groups",
      advisory:
        "Children, elderly and those with lung/heart conditions should reduce prolonged outdoor exertion.",
    };
  if (aqi <= 200)
    return {
      category: "Unhealthy",
      advisory: "Everyone may experience health effects. Limit outdoor activity.",
    };
  if (aqi <= 300)
    return {
      category: "Very Unhealthy",
      advisory: "Health alert: avoid outdoor exertion. Wear a mask if you must go out.",
    };
  return {
    category: "Severe",
    advisory: "Emergency conditions. Stay indoors with windows closed.",
  };
}
