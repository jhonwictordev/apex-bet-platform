// Sports Cache Service with TTL support

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class SportsCacheService {
  private static instance: SportsCacheService;
  private cache = new Map<string, CacheEntry<any>>();

  static getInstance(): SportsCacheService {
    if (!SportsCacheService.instance) {
      SportsCacheService.instance = new SportsCacheService();
    }
    return SportsCacheService.instance;
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlSeconds: number = 300): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlSeconds: number = 300
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }
    const fresh = await fetchFn();
    this.set(key, fresh, ttlSeconds);
    return fresh;
  }

  invalidate(keyPrefix?: string): number {
    if (!keyPrefix) {
      const size = this.cache.size;
      this.cache.clear();
      return size;
    }

    let count = 0;
    for (const key of Array.from(this.cache.keys())) {
      if (key.startsWith(keyPrefix)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  getStats(): { totalKeys: number; activeKeys: number } {
    let active = 0;
    const now = Date.now();
    const toDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (entry.expiresAt > now) {
        active++;
      } else {
        toDelete.push(key);
      }
    });

    for (const key of toDelete) {
      this.cache.delete(key);
    }

    return {
      totalKeys: this.cache.size,
      activeKeys: active,
    };
  }
}
