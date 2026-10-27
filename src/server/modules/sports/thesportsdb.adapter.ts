import {
  ISportsProviderAdapter,
  NormalizedLeague,
  NormalizedSportEvent,
  ProviderHealth,
  SportsDataSource,
} from "./types";
import { SportsCacheService } from "./sports-cache.service";
import { SportsRateLimiterService } from "./sports-rate-limiter.service";

export class TheSportsDBAdapter implements ISportsProviderAdapter {
  readonly source: SportsDataSource = "THESPORTSDB";
  readonly name = "TheSportsDB (Free Public)";

  private apiKey: string;
  private baseUrl: string;
  private cache: SportsCacheService;
  private rateLimiter: SportsRateLimiterService;

  // Major leagues available on free tier:
  // 4328: English Premier League
  // 4332: Italian Serie A
  // 4335: Spanish La Liga
  // 4331: German Bundesliga
  // 4351: Brazilian Serie A
  private featuredLeagueIds = ["4328", "4332", "4335", "4331", "4351"];

  constructor() {
    this.apiKey = process.env.THESPORTSDB_API_KEY || "123";
    this.baseUrl = process.env.THESPORTSDB_BASE_URL || "https://www.thesportsdb.com/api/v1/json";
    this.cache = SportsCacheService.getInstance();
    this.rateLimiter = SportsRateLimiterService.getInstance();
  }

  private getUrl(endpoint: string): string {
    const cleanBase = this.baseUrl.replace(/\/+$/, "");
    return `${cleanBase}/${this.apiKey}/${endpoint.replace(/^\/+/, "")}`;
  }

  private async fetchJson<T>(endpoint: string, ttlSeconds: number = 300): Promise<T | null> {
    const cacheKey = `thesportsdb:${endpoint}`;
    const cached = this.cache.get<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    if (!this.rateLimiter.canMakeRequest(this.source)) {
      console.warn(`[TheSportsDB] Rate limiter budget exhausted.`);
      return null;
    }

    const url = this.getUrl(endpoint);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { "Accept": "application/json" },
      });
      clearTimeout(timeout);

      this.rateLimiter.recordRequest(this.source, res.headers);

      if (!res.ok) {
        console.error(`[TheSportsDB] HTTP ${res.status} for ${endpoint}`);
        return null;
      }

      const data = (await res.json()) as T;
      this.cache.set(cacheKey, data, ttlSeconds);
      return data;
    } catch (err: any) {
      clearTimeout(timeout);
      console.error(`[TheSportsDB] Fetch error for ${endpoint}:`, err?.message || err);
      return null;
    }
  }

  async getHealth(): Promise<ProviderHealth> {
    const start = Date.now();
    try {
      const data = await this.fetchJson<{ sports: any[] }>("all_sports.php", 60);
      const latencyMs = Date.now() - start;
      const isAvailable = !!(data && Array.isArray(data.sports) && data.sports.length > 0);
      const quota = this.rateLimiter.getQuota(this.source);

      return {
        source: this.source,
        name: this.name,
        isAvailable,
        isConfigured: true,
        latencyMs,
        lastCheckedAt: new Date(),
        dailyRequestsUsed: quota.requestsUsedToday,
        dailyRequestsLimit: quota.dailyLimit,
        requiresKey: true,
        keyConfigured: true,
        message: isAvailable
          ? `Operacional com chave pública ${this.apiKey}. ${data.sports.length} esportes identificados.`
          : "Não foi possível obter resposta de all_sports.php",
      };
    } catch (err: any) {
      return {
        source: this.source,
        name: this.name,
        isAvailable: false,
        isConfigured: true,
        latencyMs: Date.now() - start,
        lastCheckedAt: new Date(),
        dailyRequestsUsed: 0,
        dailyRequestsLimit: 1000,
        requiresKey: true,
        keyConfigured: true,
        message: `Falha de conexão: ${err?.message || "Erro desconhecido"}`,
      };
    }
  }

  async fetchLeagues(): Promise<NormalizedLeague[]> {
    const data = await this.fetchJson<{ leagues: any[] }>("all_leagues.php", 3600);
    if (!data || !Array.isArray(data.leagues)) return [];

    return data.leagues
      .filter((l) => l.strSport === "Soccer" || l.strSport === "Basketball")
      .slice(0, 30)
      .map((l) => ({
        id: l.idLeague,
        externalId: l.idLeague,
        name: l.strLeague,
        country: l.strCountry || "International",
        sportSlug: l.strSport === "Basketball" ? "basquete" : "futebol",
        source: this.source,
      }));
  }

  async fetchBrazilianFixtures(limit: number = 10): Promise<NormalizedSportEvent[]> {
    const events: NormalizedSportEvent[] = [];

    // 1. Next Brazilian Serie A events
    const nextData = await this.fetchJson<{ events: any[] }>("eventsnextleague.php?id=4351", 600);
    if (nextData && Array.isArray(nextData.events)) {
      for (const ev of nextData.events) {
        const norm = this.normalizeEvent(ev, "UPCOMING");
        if (norm) events.push(norm);
      }
    }

    // 2. Recent Brazilian Serie A / Libertadores matches
    const pastData = await this.fetchJson<{ events: any[] }>("eventspastleague.php?id=4351", 1800);
    if (pastData && Array.isArray(pastData.events)) {
      for (const ev of pastData.events) {
        const norm = this.normalizeEvent(ev, "FINISHED");
        if (norm) events.push(norm);
      }
    }

    // 3. Search key Brazilian clubs (Flamengo, Palmeiras, Corinthians, etc.)
    const brClubs = ["Flamengo", "Palmeiras", "Corinthians", "Sao Paulo"];
    for (const club of brClubs) {
      if (events.length >= limit) break;
      const searchData = await this.fetchJson<{ event: any[] }>(`searchevents.php?e=${club}`, 1800);
      if (searchData && Array.isArray(searchData.event)) {
        for (const ev of searchData.event.slice(0, 2)) {
          const norm = this.normalizeEvent(ev, "UPCOMING");
          if (norm && !events.some((e) => e.externalId === norm.externalId)) {
            events.push(norm);
          }
        }
      }
    }

    return events.slice(0, limit);
  }

  async fetchUpcomingFixtures(limit: number = 20): Promise<NormalizedSportEvent[]> {
    const events: NormalizedSportEvent[] = [];

    for (const leagueId of this.featuredLeagueIds) {
      const data = await this.fetchJson<{ events: any[] }>(`eventsnextleague.php?id=${leagueId}`, 600);
      if (data && Array.isArray(data.events)) {
        for (const ev of data.events) {
          const normalized = this.normalizeEvent(ev, "UPCOMING");
          if (normalized) {
            events.push(normalized);
          }
        }
      }
      if (events.length >= limit) break;
    }

    // Also include Brazilian fixtures if upcoming list is below limit
    if (events.length < limit) {
      const brEvents = await this.fetchBrazilianFixtures(5);
      for (const br of brEvents) {
        if (!events.some((e) => e.externalId === br.externalId)) {
          events.push(br);
        }
      }
    }

    return events.slice(0, limit);
  }

  async fetchLiveFixtures(): Promise<NormalizedSportEvent[]> {
    // In free tier, TheSportsDB has limited live score feed; check today's events
    const today = new Date().toISOString().split("T")[0];
    const data = await this.fetchJson<{ events: any[] }>(`eventsday.php?d=${today}&s=Soccer`, 120);

    const liveEvents: NormalizedSportEvent[] = [];
    if (data && Array.isArray(data.events)) {
      for (const ev of data.events) {
        const isLive = ev.strProgress === "1" || ev.strStatus?.toLowerCase().includes("live");
        if (isLive) {
          const norm = this.normalizeEvent(ev, "LIVE");
          if (norm) liveEvents.push(norm);
        }
      }
    }
    return liveEvents;
  }

  async fetchResults(limit: number = 20): Promise<NormalizedSportEvent[]> {
    const results: NormalizedSportEvent[] = [];

    for (const leagueId of this.featuredLeagueIds) {
      const data = await this.fetchJson<{ events: any[] }>(`eventspastleague.php?id=${leagueId}`, 1800);
      if (data && Array.isArray(data.events)) {
        for (const ev of data.events) {
          const normalized = this.normalizeEvent(ev, "FINISHED");
          if (normalized) {
            results.push(normalized);
          }
        }
      }
      if (results.length >= limit) break;
    }

    return results.slice(0, limit);
  }

  private normalizeEvent(ev: any, fallbackStatus: "UPCOMING" | "LIVE" | "FINISHED"): NormalizedSportEvent | null {
    if (!ev || (!ev.strEvent && !ev.strHomeTeam)) return null;

    const homeTeam = ev.strHomeTeam || ev.strEvent?.split(" vs ")?.[0] || "Equipe Mandante";
    const awayTeam = ev.strAwayTeam || ev.strEvent?.split(" vs ")?.[1] || "Equipe Visitante";

    // Combine dateEvent and strTime
    let startTime = new Date();
    if (ev.dateEvent) {
      const timeStr = ev.strTime ? ev.strTime.split("+")[0] : "12:00:00";
      const fullIso = `${ev.dateEvent}T${timeStr}Z`;
      const parsed = new Date(fullIso);
      if (!isNaN(parsed.getTime())) {
        startTime = parsed;
      }
    }

    const homeScore = parseInt(ev.intHomeScore, 10) || 0;
    const awayScore = parseInt(ev.intAwayScore, 10) || 0;

    let status = fallbackStatus;
    if (ev.strStatus === "Match Finished" || ev.strStatus === "FT") {
      status = "FINISHED";
    } else if (ev.strStatus?.toLowerCase().includes("in play") || ev.strStatus?.toLowerCase().includes("live")) {
      status = "LIVE";
    }

    // Generate balanced odds based on realistic probabilistic ranges
    const homeOdd = Number((1.55 + ((parseInt(ev.idEvent || "10", 10) % 25) / 10)).toFixed(2));
    const drawOdd = Number((3.10 + ((parseInt(ev.idEvent || "10", 10) % 15) / 10)).toFixed(2));
    const awayOdd = Number((2.10 + ((parseInt(ev.idEvent || "10", 10) % 30) / 10)).toFixed(2));

    return {
      externalId: String(ev.idEvent || `tsdb_${Date.now()}`),
      source: this.source,
      sportSlug: ev.strSport === "Basketball" ? "basquete" : "futebol",
      sportName: ev.strSport === "Basketball" ? "Basquete" : "Futebol",
      competitionName: ev.strLeague || "Liga Internacional",
      competitionCountry: ev.strCountry || "Internacional",
      homeTeam,
      awayTeam,
      homeLogo: ev.strHomeTeamBadge || ev.strBadge || undefined,
      awayLogo: ev.strAwayTeamBadge || undefined,
      homeScore,
      awayScore,
      status,
      isLive: status === "LIVE",
      currentPeriod: ev.strProgress ? `${ev.strProgress}ºT` : undefined,
      currentMinute: ev.intMinute ? parseInt(ev.intMinute, 10) : undefined,
      startTime,
      venue: ev.strVenue || undefined,
      lastSyncedAt: new Date(),
      markets: [
        {
          key: "1X2",
          name: "Resultado Final (1X2)",
          odds: [
            { key: "1", label: homeTeam, value: homeOdd },
            { key: "X", label: "Empate", value: drawOdd },
            { key: "2", label: awayTeam, value: awayOdd },
          ],
        },
        {
          key: "OVER_UNDER_2_5",
          name: "Total de Gols (2.5)",
          odds: [
            { key: "OVER", label: "Mais de 2.5", value: 1.88 },
            { key: "UNDER", label: "Menos de 2.5", value: 1.92 },
          ],
        },
        {
          key: "BOTH_TEAMS_SCORE",
          name: "Ambas as Equipes Marcam",
          odds: [
            { key: "YES", label: "Sim", value: 1.75 },
            { key: "NO", label: "Não", value: 2.05 },
          ],
        },
      ],
      rawPayload: ev,
    };
  }
}
