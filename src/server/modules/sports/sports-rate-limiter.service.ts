// Smart Rate Limiting & Quota Budget Manager

export interface QuotaTracker {
  source: string;
  dailyLimit: number;
  requestsUsedToday: number;
  remainingToday: number;
  resetDate: string; // YYYY-MM-DD UTC
  lastRequestAt?: Date;
  isThrottled: boolean;
}

export class SportsRateLimiterService {
  private static instance: SportsRateLimiterService;
  private quotas = new Map<string, QuotaTracker>();

  constructor() {
    this.initDefaultQuotas();
  }

  static getInstance(): SportsRateLimiterService {
    if (!SportsRateLimiterService.instance) {
      SportsRateLimiterService.instance = new SportsRateLimiterService();
    }
    return SportsRateLimiterService.instance;
  }

  private getTodayUtcString(): string {
    return new Date().toISOString().split("T")[0];
  }

  private initDefaultQuotas(): void {
    const today = this.getTodayUtcString();
    // API-SPORTS: 100 requests per day on free plan
    this.quotas.set("API_SPORTS", {
      source: "API_SPORTS",
      dailyLimit: 100,
      requestsUsedToday: 0,
      remainingToday: 100,
      resetDate: today,
      isThrottled: false,
    });

    // TheSportsDB: free key 123 (soft rate limits)
    this.quotas.set("THESPORTSDB", {
      source: "THESPORTSDB",
      dailyLimit: 1000,
      requestsUsedToday: 0,
      remainingToday: 1000,
      resetDate: today,
      isThrottled: false,
    });

    // OpenLigaDB: completely open keyless API
    this.quotas.set("OPENLIGADB", {
      source: "OPENLIGADB",
      dailyLimit: 5000,
      requestsUsedToday: 0,
      remainingToday: 5000,
      resetDate: today,
      isThrottled: false,
    });
  }

  getQuota(source: string): QuotaTracker {
    this.checkDayRollover(source);
    let q = this.quotas.get(source);
    if (!q) {
      q = {
        source,
        dailyLimit: 1000,
        requestsUsedToday: 0,
        remainingToday: 1000,
        resetDate: this.getTodayUtcString(),
        isThrottled: false,
      };
      this.quotas.set(source, q);
    }
    return { ...q };
  }

  private checkDayRollover(source: string): void {
    const today = this.getTodayUtcString();
    const q = this.quotas.get(source);
    if (q && q.resetDate !== today) {
      q.resetDate = today;
      q.requestsUsedToday = 0;
      q.remainingToday = q.dailyLimit;
      q.isThrottled = false;
    }
  }

  canMakeRequest(source: string, reserve: number = 3): boolean {
    this.checkDayRollover(source);
    const q = this.quotas.get(source);
    if (!q) return true;

    // For API_SPORTS, preserve a small safety reserve
    if (source === "API_SPORTS") {
      return q.remainingToday > reserve && !q.isThrottled;
    }

    return q.remainingToday > 0 && !q.isThrottled;
  }

  recordRequest(source: string, headers?: Headers | Record<string, string>): void {
    this.checkDayRollover(source);
    let q = this.quotas.get(source);
    if (!q) return;

    q.requestsUsedToday += 1;
    q.remainingToday = Math.max(0, q.dailyLimit - q.requestsUsedToday);
    q.lastRequestAt = new Date();

    // If API-SPORTS returned rate limit headers, sync with upstream truth
    if (headers) {
      const getHeader = (name: string): string | null => {
        if (headers instanceof Headers) return headers.get(name);
        return (headers as Record<string, string>)[name] || (headers as Record<string, string>)[name.toLowerCase()] || null;
      };

      const remainingHeader = getHeader("x-ratelimit-requests-remaining");
      const limitHeader = getHeader("x-ratelimit-requests-limit");

      if (remainingHeader !== null) {
        const remaining = parseInt(remainingHeader, 10);
        if (!isNaN(remaining)) {
          q.remainingToday = remaining;
        }
      }
      if (limitHeader !== null) {
        const limit = parseInt(limitHeader, 10);
        if (!isNaN(limit)) {
          q.dailyLimit = limit;
        }
      }
    }

    if (q.remainingToday <= 0) {
      q.isThrottled = true;
    }
  }

  updateFromUpstreamStatus(source: string, current: number, limit: number): void {
    this.checkDayRollover(source);
    let q = this.quotas.get(source);
    if (!q) return;

    q.dailyLimit = limit;
    q.requestsUsedToday = current;
    q.remainingToday = Math.max(0, limit - current);
    q.isThrottled = q.remainingToday <= 0;
  }

  resetQuota(source: string): void {
    const q = this.quotas.get(source);
    if (q) {
      q.requestsUsedToday = 0;
      q.remainingToday = q.dailyLimit;
      q.isThrottled = false;
    }
  }
}
