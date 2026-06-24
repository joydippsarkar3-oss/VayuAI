/**
 * In-memory TTL cache — MVP stand-in for the PRD's Redis layer (PRD §7.1).
 * Per-source responses and fused results are cached for a short TTL to respect
 * free-tier rate limits and keep the app fast. In production this maps 1:1 to Redis.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class TtlCache<T> {
  private store = new Map<string, CacheEntry<T>>();

  constructor(private defaultTtlMs: number = 5 * 60 * 1000) {}

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T, ttlMs?: number): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + (ttlMs ?? this.defaultTtlMs),
    });
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  clear(): void {
    this.store.clear();
  }
}

// Module-level singletons survive across hot reloads in dev.
export const weatherCache = new TtlCache<any>(5 * 60 * 1000); // 5 min
export const citiesCache = new TtlCache<any[]>(60 * 60 * 1000); // 1 hour
