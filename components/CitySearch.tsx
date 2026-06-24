"use client";

import { useEffect, useRef, useState } from "react";
import { INDIA_CITIES } from "@/lib/cities";

export interface CityChoice {
  name: string;
  admin1?: string;
  latitude: number;
  longitude: number;
}

/**
 * City search with autocomplete (PRD §6.3).
 * Debounced query against /api/cities (curated DB + keyless Open-Meteo geocoding).
 */
export function CitySearch({
  onSelect,
}: {
  onSelect: (city: CityChoice) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CityChoice[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/cities?q=${encodeURIComponent(query.trim())}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setResults(data.cities ?? []);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 220);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function choose(city: CityChoice) {
    onSelect(city);
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  return (
    <div ref={boxRef} className="relative w-full">
      <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-card ring-1 ring-slate-900/5">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-sky-600" fill="none">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <line x1="16.5" y1="16.5" x2="21" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search any Indian city or town…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
          aria-label="Search city"
        />
        {loading && <span className="text-xs text-slate-400">…</span>}
      </div>

      {open && (results.length > 0 || query.trim().length >= 2) && (
        <div className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-xl bg-white py-1 shadow-cardhover ring-1 ring-slate-900/10">
          {results.length === 0 && !loading ? (
            <div className="px-3 py-2 text-sm text-slate-500">
              No matches. Try a nearby larger town.
            </div>
          ) : (
            results.map((c) => (
              <button
                key={`${c.name}-${c.admin1}-${c.latitude}`}
                onClick={() => choose(c)}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-sky-50"
              >
                <span className="font-medium text-slate-800">{c.name}</span>
                <span className="text-xs text-slate-500">
                  {c.admin1 ? `${c.admin1} · ` : ""}
                  {c.latitude.toFixed(2)}, {c.longitude.toFixed(2)}
                </span>
              </button>
            ))
          )}
        </div>
      )}

      <div className="mt-2 flex flex-wrap gap-1.5">
        <span className="text-xs text-slate-500">Popular:</span>
        {INDIA_CITIES.slice(0, 6).map((c) => (
          <button
            key={c.name}
            onClick={() => choose(c)}
            className="chip bg-white/70 text-slate-600 ring-1 ring-slate-900/5 hover:bg-white"
          >
            {c.name}
          </button>
        ))}
      </div>
    </div>
  );
}
