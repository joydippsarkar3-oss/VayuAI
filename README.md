# VayuAI 🌤️

**AI-Powered Multi-Source Daily Weather Intelligence for India**

VayuAI fuses live weather data from multiple free, keyless sources using an AI
ensemble model, then delivers hyper-accurate, day-by-day forecasts with confidence
scoring, plain-language summaries, smart alerts, rainfall intelligence, AQI, and an
agriculture mode — across India.

Built to the **VayuAI PRD v1.0**. This repository contains a working MVP web app
that implements the PRD's core differentiator: **multi-source data fusion**.

---

## ✨ What this MVP does

The headline feature of VayuAI is the **AI Ensemble Fusion Engine (AEFE)** — it
pulls live data from **3 independent weather APIs**, normalises them to a common
schema, fuses them with a weighted ensemble, scores confidence from inter-source
agreement, and produces a single, trustworthy daily forecast. **No single source
is ever trusted alone.**

This MVP implements **all** of the AEFE pipeline and most of the user-facing
features from the PRD:

| PRD section | Feature | MVP status |
|---|---|---|
| §5.1 Step 1 | Normalise all sources to a common schema | ✅ |
| §5.1 Step 2 | Weighted ensemble (`Σ value×weight / Σ weights`) | ✅ equal weights (PRD Phase 1) |
| §5.1 Step 3 | XGBoost bias correction per city | ⚠️ **documented stub** (Phase 2) |
| §5.1 Step 4 | LLM daily summary | ✅ templates always; optional LLM if key set |
| §5.1 Step 5 | Confidence score 0–100 + low-confidence warning | ✅ |
| §6.1 | 7-day dashboard + "Today" hero + source-agreement indicator | ✅ |
| §6.2 | Rainfall intelligence (mm, cumulative, monsoon flag) | ✅ |
| §6.3 | Multi-city search + save up to 10 (localStorage) | ✅ |
| §6.4 | Smart alerts (heavy rain, heat, storm, cold, wind, UV) | ✅ in-UI |
| §6.5 | Agriculture & outdoor mode ("good day to dry crops") | ✅ |
| §6.6 | Air Quality Index with CPCB-band advisory | ✅ via Open-Meteo Air Quality |
| §7.2 | Next.js web app, Recharts, Zustand | ✅ |

### What is deliberately out of scope (PRD Phase 2–4)

These are **not** in the MVP but are noted in the PRD as later-phase work:

- **React Native mobile app** — the PRD's mobile target. The web app is the MVP surface.
- **FastAPI separate backend** — the Next.js API routes serve as the API gateway instead.
- **Real XGBoost bias models** — requires IMD ground-truth ingestion + training. The
  `applyBiasCorrection()` seam exists and is documented; it's a no-op pass-through today.
- **Redis** — an in-memory TTL cache stands in (same interface, no infra).
- **Firebase push notifications** — alerts surface in-UI instead.
- **PostgreSQL/TimescaleDB** — no persistence layer needed for a read-only forecast MVP.
- **5,000-city lat/lon grid** — city search is unbounded via keyless geocoding instead.

---

## 🔌 Data sources (all free, all keyless — no signup required)

| Source | What it provides | Key needed? |
|---|---|---|
| **Open-Meteo** | 7-day temp, rain mm, rain prob, wind, humidity, UV, sunrise/sunset | ❌ none |
| **wttr.in** | 3-day temp, feels-like, rain, cloud, condition | ❌ none |
| **7Timer!** | 7-day temp, weather code, wind (Beaufort) | ❌ none |
| **Open-Meteo Air Quality** | PM2.5 + US AQI → mapped to CPCB India band | ❌ none |

The PRD lists 6 sources (these 3 + OpenWeatherMap, WeatherAPI, IMD). The MVP uses
the **3 fully keyless** ones so it runs with zero setup. The PRD's own risk
mitigation (§11) confirms this is sufficient: *"any 3 sources sufficient for
ensemble."* Optional keys for the other sources are stubbed in `.env.example`.

---

## 🚀 Run it

**Prerequisites:** Node.js 18+ (built and tested on Node 24).

```bash
npm install
npm run dev
```

Then open **http://localhost:3000**.

Search any Indian city (Delhi, Mumbai, Chennai, a tier-3 town, or lat,lon) and the
app fetches live data from all 3 sources, fuses it, and displays the result.

### Verify the API directly

```bash
curl "http://localhost:3000/api/weather?q=Delhi"   # fused 7-day forecast
curl "http://localhost:3000/api/cities?q=chen"     # city search
```

### Production build

```bash
npm run build
npm start
```

---

## 🧠 How the fusion engine works (PRD §5.1)

```
Open-Meteo ─┐
wttr.in     ─┼─► normalise → weighted ensemble → bias(correct) → confidence → summary + alerts
7Timer!     ─┘                                                    ↑
Open-Meteo Air Quality ────────────────────────────────────► AQI card
```

1. **Fetch** all sources in parallel. If any fails, fusion continues with the rest
   (graceful degradation — surfaced honestly in the UI as a "down" source).
2. **Normalise** each response to `{date, tempMax, tempMin, rainfallMm, ...}`.
   Missing fields become `null`.
3. **Ensemble**: for each field, `fused = Σ(value × weight) / Σ weight` over the
   non-null sources only. Weights are equal in this MVP (PRD Phase 1).
4. **Bias correction**: a documented no-op seam (`applyBiasCorrection`) where
   per-city XGBoost offsets plug in during Phase 2.
5. **Confidence (0–100)**: derived from inter-source agreement (variance), source
   coverage, forecast horizon, and rain-disagreement. **Score < 50** shows a
   "Low confidence, check back later" warning (PRD Step 5).
6. **Summary**: deterministic template engine produces PRD-style prose
   (*"Monday will be mostly cloudy in Delhi, with a high of 40°C..."*). Optional
   LLM path via `ANTHROPIC_API_KEY`.

---

## 🗂️ Project structure

```
app/
  api/
    weather/route.ts    GET ?q=city → fused forecast (TTL-cached 5 min)
    cities/route.ts     GET ?q=… → curated DB + keyless geocoding
  page.tsx              Dashboard (search, hero, 7-day grid, modules)
  layout.tsx, globals.css
lib/
  sources/              openmeteo, wttr, seventimer, airquality connectors
  fusion/
    schema.ts           common normalised schema + alert types
    ensemble.ts         weighted mean + bias stub (Steps 2 & 3)
    confidence.ts       0–100 scoring (Step 5)
    index.ts            orchestration (fetch → fuse → score → summary)
  summary/templates.ts  deterministic summary + optional LLM path (Step 4)
  alerts.ts             smart alerts (§6.4)
  cities.ts             curated India DB (60+ cities, all states/UTs)
  cache.ts              in-memory TTL cache (Redis stand-in)
  store.ts              Zustand saved-cities store (§6.3)
components/             CitySearch, TodayHeroCard, ForecastCard, SourceAgreement,
                       AqiCard, AlertList, RainfallModule, AgricultureMode,
                       TrendChart, SavedCities, ConfidenceBadge, Icons
```

---

## 🔑 Optional API keys

The app runs with **no keys**. To enrich it, copy `.env.example` → `.env.local`:

| Variable | Effect |
|---|---|
| `ANTHROPIC_API_KEY` | Switches daily summaries from templates to Claude (PRD Step 4) |
| `OPENWEATHERMAP_API_KEY` | *(Phase 2 hook)* adds OpenWeatherMap to the ensemble |
| `WEATHERAPI_KEY` | *(Phase 2 hook)* adds WeatherAPI.com to the ensemble |

---

## ⚠️ Honesty notes

- **No fabricated accuracy metrics.** The PRD's targets (§3.2: >78% rain accuracy,
  <1.5°C RMSE) are *goals*, not MVP claims. The confidence score reflects real
  inter-source agreement, not a trained model's accuracy.
- **Confidence is heuristic, not ML.** It's derived from source agreement, coverage
  and horizon — honest and explainable, but not a learned model.
- **Days 4–7 have lower confidence by design.** wttr.in only provides 3 days, so
  later days fuse from fewer sources. The confidence score and source indicators
  surface this transparently rather than hiding it.
- **AQI uses US AQI mapped to CPCB bands.** True CPCB AQI needs sub-indices from
  multiple pollutants; we approximate from PM2.5 (documented in `lib/sources/airquality.ts`).

---

## 🛠️ Tech stack

- **Next.js 15** (App Router) — full-stack, API routes act as the PRD's API gateway
- **TypeScript** + **Tailwind CSS**
- **Recharts** — 7-day temperature trend
- **Zustand** — saved-cities state (persisted to localStorage)

---

*VayuAI MVP v1.0 — built to PRD v1.0. Data: Open-Meteo · wttr.in · 7Timer! · Open-Meteo Air Quality.*
