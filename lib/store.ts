"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Saved-cities store — PRD §6.3 ("Save up to 10 cities, free tier").
 * Persisted to localStorage so saved cities survive reloads (no DB needed for MVP).
 */

export interface SavedCity {
  name: string;
  admin1?: string;
  latitude: number;
  longitude: number;
}

interface SavedCitiesState {
  cities: SavedCity[];
  active: SavedCity | null;
  addCity: (city: SavedCity) => boolean; // returns false if limit reached
  removeCity: (name: string) => void;
  setActive: (city: SavedCity) => void;
  hasCity: (name: string) => boolean;
}

const FREE_TIER_LIMIT = 10; // PRD §6.3

export const useSavedCities = create<SavedCitiesState>()(
  persist(
    (set, get) => ({
      cities: [],
      active: null,
      addCity: (city) => {
        const { cities } = get();
        if (cities.some((c) => c.name === city.name)) return true;
        if (cities.length >= FREE_TIER_LIMIT) return false;
        set({ cities: [...cities, city] });
        return true;
      },
      removeCity: (name) =>
        set((s) => ({
          cities: s.cities.filter((c) => c.name !== name),
          active: s.active?.name === name ? null : s.active,
        })),
      setActive: (city) => set({ active: city }),
      hasCity: (name) => get().cities.some((c) => c.name === name),
    }),
    { name: "vayuai-saved-cities" }
  )
);
