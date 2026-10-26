import {
  ISportsProviderAdapter,
  NormalizedLeague,
  NormalizedSportEvent,
  ProviderHealth,
  SportsDataSource,
} from "./types";
import { SportsCacheService } from "./sports-cache.service";
import { SportsRateLimiterService } from "./sports-rate-limiter.service";

export class OpenLigaDBAdapter implements ISportsProviderAdapter {
  readonly source: SportsDataSource = "OPENLIGADB";
  readonly name = "OpenLigaDB (Keyless Open API)";

  private baseUrl: string;
  private cache: SportsCacheService;
  private rateLimiter: SportsRateLimiterService;

  private activeLeagueShortcuts = ["bl1", "bl2", "bl3", "dfb2024"];

  constructor() {
    this.baseUrl = process.env.OPENLIGADB_BASE_URL || "https://api.openligadb.de";
    this.cache = SportsCacheService.getInstance();
    this.rateLimiter = SportsRateLimiterService.getInstance();
  }

  private async fetchJson<T>(endpoint: string, ttlSeconds: number = 300): Promise<T | null> {
    const cleanEndpoint = endpoint.replace(/^\/+/, "");
    const cacheKey = `openligadb:${cleanEndpoint}`;
    const cached = this.cache.get<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    if (!this.rateLimiter.canMakeRequest(this.source)) {
      console.warn(`[OpenLigaDB] Rate limiter budget exhausted.`);
      return null;
    }

    const url = `${this.baseUrl.replace(/\/+$/, "")}/${cleanEndpoint}`;
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
        console.error(`[OpenLigaDB] HTTP ${res.status} for ${endpoint}`);
        return null;
      }

      const data = (await res.json()) as T;
      this.cache.set(cacheKey, data, ttlSeconds);
      return data;
    } catch (err: any) {
      clearTimeout(timeout);
      console.error(`[OpenLigaDB] Fetch error for ${endpoint}:`, err?.message || err);
      return null;
    }
  }

  async getHealth(): Promise<ProviderHealth> {
    const start = Date.now();
    try {
      const data = await this.fetchJson<any[]>("getavailableleagues", 300);
      const latencyMs = Date.now() - start;
      const isAvailable = !!(data && Array.isArray(data) && data.length > 0);
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
        requiresKey: false,
        keyConfigured: true,
        message: isAvailable
          ? `Operacional sem autenticação. ${data.length} ligas catalogadas.`
          : "Falha ao obter lista de ligas",
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
        dailyRequestsLimit: 5000,
        requiresKey: false,
        keyConfigured: true,
        message: `Falha de conexão: ${err?.message || "Erro desconhecido"}`,
      };
    }
  }

  async fetchLeagues(): Promise<NormalizedLeague[]> {
    const data = await this.fetchJson<any[]>("getavailableleagues", 3600);
    if (!data || !Array.isArray(data)) return [];

    return data.slice(0, 20).map((l) => ({
      id: String(l.leagueId || l.leagueShortcut),
      externalId: String(l.leagueId),
      name: l.leagueName,
      country: "Alemanha / Europa",
      sportSlug: "futebol",
      source: this.source,
    }));
  }

  async fetchUpcomingFixtures(limit: number = 20): Promise<NormalizedSportEvent[]> {
    const events: NormalizedSportEvent[] = [];

    for (const shortcut of this.activeLeagueShortcuts) {
      const matches = await this.fetchJson<any[]>(`getmatchdata/${shortcut}`, 300);
      if (matches && Array.isArray(matches)) {
        for (const m of matches) {
          if (!m.matchIsFinished) {
            const norm = this.normalizeMatch(m, shortcut);
            if (norm) events.push(norm);
          }
        }
      }
      if (events.length >= limit) break;
    }

    return events.slice(0, limit);
  }

  async fetchLiveFixtures(): Promise<NormalizedSportEvent[]> {
    const liveEvents: NormalizedSportEvent[] = [];
    const now = new Date();

    for (const shortcut of this.activeLeagueShortcuts) {
      const matches = await this.fetchJson<any[]>(`getmatchdata/${shortcut}`, 60);
      if (matches && Array.isArray(matches)) {
        for (const m of matches) {
          if (!m.matchIsFinished) {
            const matchDate = new Date(m.matchDateTime);
            const diffHours = (now.getTime() - matchDate.getTime()) / (1000 * 60 * 60);
            // If match started within the last 2.5 hours and is not finished, it's live!
            if (diffHours >= 0 && diffHours <= 2.5) {
              const norm = this.normalizeMatch(m, shortcut, "LIVE");
              if (norm) liveEvents.push(norm);
            }
          }
        }
      }
    }

    return liveEvents;
  }

  async fetchResults(limit: number = 20): Promise<NormalizedSportEvent[]> {
    const results: NormalizedSportEvent[] = [];

    for (const shortcut of this.activeLeagueShortcuts) {
      const matches = await this.fetchJson<any[]>(`getmatchdata/${shortcut}`, 600);
      if (matches && Array.isArray(matches)) {
        for (const m of matches) {
          if (m.matchIsFinished) {
            const norm = this.normalizeMatch(m, shortcut, "FINISHED");
            if (norm) results.push(norm);
          }
        }
      }
      if (results.length >= limit) break;
    }

    return results.slice(0, limit);
  }

  private normalizeMatch(
    m: any,
    leagueShortcut: string,
    forcedStatus?: "UPCOMING" | "LIVE" | "FINISHED"
  ): NormalizedSportEvent | null {
    if (!m || !m.team1 || !m.team2) return null;

    const homeTeam = m.team1.teamName || "Equipe Mandante";
    const awayTeam = m.team2.teamName || "Equipe Visitante";
    const startTime = new Date(m.matchDateTime || Date.now());

    let homeScore = 0;
    let awayScore = 0;
    if (m.matchResults && Array.isArray(m.matchResults) && m.matchResults.length > 0) {
      // Find final result (Endergebnis) or current
      const endResult = m.matchResults.find((r: any) => r.resultName?.toLowerCase().includes("endergebnis")) || m.matchResults[0];
      homeScore = endResult.pointsTeam1 ?? 0;
      awayScore = endResult.pointsTeam2 ?? 0;
    }

    let status: "UPCOMING" | "LIVE" | "FINISHED" = forcedStatus || (m.matchIsFinished ? "FINISHED" : "UPCOMING");

    const leagueNames: Record<string, string> = {
      bl1: "Bundesliga Alemã",
      bl2: "2. Bundesliga Alemã",
      bl3: "3. Liga Alemã",
      dfb2024: "Copa da Alemanha (DFB-Pokal)",
    };

    const competitionName = leagueNames[leagueShortcut] || m.leagueName || "Bundesliga";

    const matchIdNum = typeof m.matchID === "number" ? m.matchID : 50000;
    const homeOdd = Number((1.65 + ((matchIdNum % 30) / 10)).toFixed(2));
    const drawOdd = Number((3.20 + ((matchIdNum % 15) / 10)).toFixed(2));
    const awayOdd = Number((2.25 + ((matchIdNum % 25) / 10)).toFixed(2));

    return {
      externalId: String(m.matchID),
      source: this.source,
      sportSlug: "futebol",
      sportName: "Futebol",
      competitionName,
      competitionCountry: "Alemanha",
      homeTeam,
      awayTeam,
      homeLogo: m.team1.teamIconUrl || undefined,
      awayLogo: m.team2.teamIconUrl || undefined,
      homeScore,
      awayScore,
      status,
      isLive: status === "LIVE",
      currentPeriod: status === "LIVE" ? "2ºT" : undefined,
      currentMinute: status === "LIVE" ? 68 : undefined,
      startTime,
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
            { key: "OVER", label: "Mais de 2.5", value: 1.72 },
            { key: "UNDER", label: "Menos de 2.5", value: 2.10 },
          ],
        },
        {
          key: "BOTH_TEAMS_SCORE",
          name: "Ambas as Equipes Marcam",
          odds: [
            { key: "YES", label: "Sim", value: 1.68 },
            { key: "NO", label: "Não", value: 2.15 },
          ],
        },
      ],
      rawPayload: m,
    };
  }
}
