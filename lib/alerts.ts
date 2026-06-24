import type { FusedDayForecast, WeatherAlert, AlertSeverity } from "@/lib/fusion/schema";

// Re-export so existing imports from "@/lib/alerts" still work.
export type { WeatherAlert, AlertSeverity };

/**
 * Smart alerts — PRD §6.4.
 *
 * Push alerts for: heavy rainfall (>30mm/day), cyclone approach, extreme heat (>44°C),
 * cold wave, dense fog, and thunderstorm.
 *
 * MVP surfaces these in-UI (no Firebase). Each alert is tagged with severity and the
 * date(s) it applies to, derived from the fused 7-day forecast.
 */

export function evaluateAlerts(days: FusedDayForecast[], cityName: string): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];
  const todayISO = days[0]?.date;

  days.forEach((day, idx) => {
    const dayLabel = idx === 0 ? "Today" : idx === 1 ? "Tomorrow" : weekdayName(day.date);

    // Heavy rainfall > 30mm/day (PRD threshold)
    if (day.rainfallMm !== null && day.rainfallMm >= 30) {
      alerts.push({
        id: `heavy-rain-${day.date}`,
        type: "heavy-rain",
        severity: "severe",
        title: "Heavy Rainfall Warning",
        message: `${Math.round(day.rainfallMm)}mm of rain expected in ${cityName}. Risk of waterlogging in low-lying areas. Avoid unnecessary travel.`,
        date: day.date,
        dayLabel,
      });
    }

    // Extreme heat > 44°C (PRD threshold)
    if (day.tempMax !== null && day.tempMax >= 44) {
      alerts.push({
        id: `extreme-heat-${day.date}`,
        type: "extreme-heat",
        severity: "severe",
        title: "Extreme Heat Alert",
        message: `High of ${Math.round(day.tempMax)}°C forecast for ${cityName}. Stay hydrated, avoid direct sun between 11 AM–4 PM.`,
        date: day.date,
        dayLabel,
      });
    } else if (day.tempMax !== null && day.tempMax >= 40 && day.date === todayISO) {
      alerts.push({
        id: `heat-${day.date}`,
        type: "extreme-heat",
        severity: "warning",
        title: "Hot Day",
        message: `High of ${Math.round(day.tempMax)}°C. Limit outdoor exertion around midday.`,
        date: day.date,
        dayLabel,
      });
    }

    // Thunderstorm (condition flag from sources)
    if (day.conditionCode === "thunderstorm") {
      alerts.push({
        id: `thunderstorm-${day.date}`,
        type: "thunderstorm",
        severity: "warning",
        title: "Thunderstorm Expected",
        message: `Thunderstorms likely in ${cityName}. Secure loose objects outdoors; avoid open areas.`,
        date: day.date,
        dayLabel,
      });
    }

    // Cold wave < 10°C (north India winters)
    if (day.tempMin !== null && day.tempMin <= 4) {
      alerts.push({
        id: `cold-wave-${day.date}`,
        type: "cold-wave",
        severity: "warning",
        title: "Cold Wave",
        message: `Overnight low near ${Math.round(day.tempMin)}°C. Protect crops and livestock; dress warmly.`,
        date: day.date,
        dayLabel,
      });
    }

    // High wind > 35 km/h
    if (day.windKmh !== null && day.windKmh >= 35) {
      alerts.push({
        id: `high-wind-${day.date}`,
        type: "high-wind",
        severity: "warning",
        title: "Strong Winds",
        message: `Winds up to ${Math.round(day.windKmh)} km/h. Secure outdoor items; use caution if driving.`,
        date: day.date,
        dayLabel,
      });
    }

    // High UV (today only)
    if (idx === 0 && day.uvIndex !== null && day.uvIndex >= 8) {
      alerts.push({
        id: `high-uv-${day.date}`,
        type: "high-uv",
        severity: "info",
        title: "Very High UV",
        message: `UV index ${Math.round(day.uvIndex)}. Apply sunscreen and wear a hat if outside.`,
        date: day.date,
        dayLabel,
      });
    }
  });

  return alerts;
}

function weekdayName(iso: string): string {
  const [y, m, d] = iso.split("-").map((n) => parseInt(n, 10));
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", { weekday: "short" });
}
