import { prisma } from "@/lib/db";
import {
  ISportsProviderAdapter,
  NormalizedLeague,
  NormalizedSportEvent,
  ProviderHealth,
  SportsDataSource,
} from "./types";
import { SportsCacheService } from "./sports-cache.service";
import { SportsRateLimiterService } from "./sports-rate-limiter.service";

export class ApiSportsAdapter implements ISportsProviderAdapter {
  readonly source: SportsDataSource = "API_SPORTS";
  readonly name = "API-SPORTS (Free Tier 100 req/day)";

  private footballBaseUrl: string;
  private basketballBaseUrl: string;
  private cache: SportsCacheService;
  private rateLimiter: SportsRateLimiterService;

  // Key IDs for major Brazilian & International competitions in API-SPORTS:
  // 71: Brasileirão Série A
  // 72: Brasileirão Série B
  // 73: Copa do Brasil
  // 13: Copa Libertadores
  // 39: Premier League
  // 140: La Liga
  // 78: Bundesliga
  // 2: UEFA Champions League
  public readonly priorityFootballLeagues = [
    { id: 71, name: "Brasileirão Série A", country: "Brasil" },
    { id: 72, name: "Brasileirão Série B", country: "Brasil" },
    { id: 73, name: "Copa do Brasil", country: "Brasil" },
    { id: 13, name: "Copa Libertadores", country: "América do Sul" },
    { id: 39, name: "Premier League", country: "Inglaterra" },
    { id: 140, name: "La Liga", country: "Espanha" },
    { id: 78, name: "Bundesliga", country: "Alemanha" },
    { id: 2, name: "UEFA Champions League", country: "Europa" },
  ];

  constructor() {
    this.footballBaseUrl = process.env.API_SPORTS_FOOTBALL_URL || "https://v3.football.api-sports.io";
    this.basketballBaseUrl = process.env.API_SPORTS_BASKETBALL_URL || "https://v1.basketball.api-sports.io";
    this.cache = SportsCacheService.getInstance();
    this.rateLimiter = SportsRateLimiterService.getInstance();
  }

  /**
   * Resolves API key securely from:
   * 1. Database SystemSettings (API_SPORTS_KEY)
   * 2. Process environment (API_SPORTS_KEY)
   */
  async getApiKey(): Promise<string | null> {
    try {
      const dbSetting = await prisma.systemSettings.findUnique({
        where: { key: "API_SPORTS_KEY" },
      });
      if (dbSetting?.value && dbSetting.value.trim().length > 0) {
        return dbSetting.value.trim();
      }
    } catch {
      // Prisma may be initializing
    }

    if (process.env.API_SPORTS_KEY && process.env.API_SPORTS_KEY.trim().length > 0) {
      return process.env.API_SPORTS_KEY.trim();
    }

    return null;
  }

  async setApiKey(key: string): Promise<boolean> {
    const cleanKey = key.trim();
    if (!cleanKey) return false;

    // Validate key against status endpoint before saving
    const testResult = await this.testKey(cleanKey);
    if (!testResult.isValid) {
      throw new Error(testResult.message || "Chave inválida fornecida pela API-SPORTS");
    }

    await prisma.systemSettings.upsert({
      where: { key: "API_SPORTS_KEY" },
      update: { value: cleanKey, description: "API-SPORTS Key (Free Plan)" },
      create: { key: "API_SPORTS_KEY", value: cleanKey, description: "API-SPORTS Key (Free Plan)" },
    });

    // Invalidate status cache
    this.cache.invalidate("apisports:status");
    return true;
  }

  async testKey(key: string): Promise<{ isValid: boolean; message: string; requestsCurrent?: number; requestsLimit?: number; account?: any }> {
    if (!key || key.trim().length === 0) {
      return { isValid: false, message: "Chave não informada." };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch(`${this.footballBaseUrl}/status`, {
        signal: controller.signal,
        headers: {
          "x-apisports-key": key.trim(),
          "Accept": "application/json",
        },
      });
      clearTimeout(timeout);

      if (!res.ok) {
        return {
          isValid: false,
          message: `API-SPORTS respondeu HTTP ${res.status}. Verifique se a chave está ativa no dashboard.`,
        };
      }

      const json = await res.json();
      if (json.errors && Object.keys(json.errors).length > 0) {
        const errorMsg = typeof json.errors === "object" ? JSON.stringify(json.errors) : String(json.errors);
        return { isValid: false, message: `Erro da API-SPORTS: ${errorMsg}` };
      }

      const reqCurrent = json.response?.requests?.current ?? 0;
      const reqLimit = json.response?.requests?.limit_day ?? 100;

      // Update rate limiter
      this.rateLimiter.updateFromUpstreamStatus(this.source, reqCurrent, reqLimit);

      return {
        isValid: true,
        message: "Chave autenticada com sucesso no plano gratuito da API-SPORTS.",
        requestsCurrent: reqCurrent,
        requestsLimit: reqLimit,
        account: json.response?.account,
      };
    } catch (err: any) {
      clearTimeout(timeout);
      return {
        isValid: false,
        message: `Falha de conexão com API-SPORTS: ${err?.message || "Timeout"}`,
      };
    }
  }

  private async fetchJson<T>(
    endpoint: string,
    baseUrl: string = this.footballBaseUrl,
    ttlSeconds: number = 300
  ): Promise<T | null> {
    const key = await this.getApiKey();
    if (!key) {
      return null;
    }

    const cacheKey = `apisports:${baseUrl}:${endpoint}`;
    const cached = this.cache.get<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    if (!this.rateLimiter.canMakeRequest(this.source)) {
      console.warn(`[API-SPORTS] Rate limit budget reserved or exhausted.`);
      return null;
    }

    const cleanEndpoint = endpoint.replace(/^\/+/, "");
    const url = `${baseUrl.replace(/\/+$/, "")}/${cleanEndpoint}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          "x-apisports-key": key,
          "Accept": "application/json",
        },
      });
      clearTimeout(timeout);

      this.rateLimiter.recordRequest(this.source, res.headers);

      if (!res.ok) {
        console.error(`[API-SPORTS] HTTP ${res.status} for ${endpoint}`);
        return null;
      }

      const json = await res.json();
      if (json.errors && Object.keys(json.errors).length > 0) {
        console.error(`[API-SPORTS] API Error for ${endpoint}:`, json.errors);
        return null;
      }

      this.cache.set(cacheKey, json, ttlSeconds);
      return json as T;
    } catch (err: any) {
      clearTimeout(timeout);
      console.error(`[API-SPORTS] Fetch error for ${endpoint}:`, err?.message || err);
      return null;
    }
  }

  async getHealth(): Promise<ProviderHealth> {
    const key = await this.getApiKey();
    const quota = this.rateLimiter.getQuota(this.source);

    if (!key) {
      return {
        source: this.source,
        name: this.name,
        isAvailable: false,
        isConfigured: false,
        latencyMs: 0,
        lastCheckedAt: new Date(),
        dailyRequestsUsed: quota.requestsUsedToday,
        dailyRequestsLimit: quota.dailyLimit,
        requiresKey: true,
        keyConfigured: false,
        message: "Chave individual API-SPORTS ausente. Obtenha sua chave gratuita em https://dashboard.api-football.com/register",
        signupUrl: "https://dashboard.api-football.com/register",
      };
    }

    const start = Date.now();
    const test = await this.testKey(key);
    const latencyMs = Date.now() - start;

    return {
      source: this.source,
      name: this.name,
      isAvailable: test.isValid,
      isConfigured: true,
      latencyMs,
      lastCheckedAt: new Date(),
      dailyRequestsUsed: test.requestsCurrent ?? quota.requestsUsedToday,
      dailyRequestsLimit: test.requestsLimit ?? quota.dailyLimit,
      requiresKey: true,
      keyConfigured: true,
      message: test.message,
      signupUrl: "https://dashboard.api-football.com/register",
    };
  }

  async fetchLeagues(): Promise<NormalizedLeague[]> {
    return this.priorityFootballLeagues.map((l) => ({
      id: String(l.id),
      externalId: String(l.id),
      name: l.name,
      country: l.country,
      sportSlug: "futebol",
      source: this.source,
    }));
  }

  async fetchLiveFixtures(): Promise<NormalizedSportEvent[]> {
    const data = await this.fetchJson<{ response: any[] }>("fixtures?live=all", this.footballBaseUrl, 60);
    if (!data || !Array.isArray(data.response)) return [];

    return data.response.map((f) => this.normalizeFixture(f, "LIVE")).filter(Boolean) as NormalizedSportEvent[];
  }

  async fetchUpcomingFixtures(limit: number = 20): Promise<NormalizedSportEvent[]> {
    const today = new Date().toISOString().split("T")[0];
    const data = await this.fetchJson<{ response: any[] }>(`fixtures?date=${today}`, this.footballBaseUrl, 600);
    if (!data || !Array.isArray(data.response)) return [];

    const upcoming = data.response
      .filter((f) => f.fixture?.status?.short === "NS" || f.fixture?.status?.short === "TBD")
      .slice(0, limit)
      .map((f) => this.normalizeFixture(f, "UPCOMING"))
      .filter(Boolean) as NormalizedSportEvent[];

    return upcoming;
  }

  async fetchResults(limit: number = 20): Promise<NormalizedSportEvent[]> {
    const today = new Date().toISOString().split("T")[0];
    const data = await this.fetchJson<{ response: any[] }>(`fixtures?date=${today}`, this.footballBaseUrl, 1800);
    if (!data || !Array.isArray(data.response)) return [];

    const finished = data.response
      .filter((f) => f.fixture?.status?.short === "FT" || f.fixture?.status?.short === "AET" || f.fixture?.status?.short === "PEN")
      .slice(0, limit)
      .map((f) => this.normalizeFixture(f, "FINISHED"))
      .filter(Boolean) as NormalizedSportEvent[];

    return finished;
  }

  async fetchBrazilianFixtures(leagueId: number = 71): Promise<NormalizedSportEvent[]> {
    const currentYear = new Date().getFullYear();
    const data = await this.fetchJson<{ response: any[] }>(
      `fixtures?league=${leagueId}&season=${currentYear}&next=10`,
      this.footballBaseUrl,
      1800
    );
    if (!data || !Array.isArray(data.response)) return [];

    return data.response.map((f) => this.normalizeFixture(f, "UPCOMING")).filter(Boolean) as NormalizedSportEvent[];
  }

  async fetchBasketballFixtures(): Promise<NormalizedSportEvent[]> {
    const today = new Date().toISOString().split("T")[0];
    const data = await this.fetchJson<{ response: any[] }>(`games?date=${today}`, this.basketballBaseUrl, 600);
    if (!data || !Array.isArray(data.response)) return [];

    return data.response.slice(0, 10).map((g) => this.normalizeBasketballGame(g)).filter(Boolean) as NormalizedSportEvent[];
  }

  private normalizeFixture(f: any, fallbackStatus: "UPCOMING" | "LIVE" | "FINISHED"): NormalizedSportEvent | null {
    if (!f || !f.teams?.home || !f.teams?.away) return null;

    const fixture = f.fixture;
    const teams = f.teams;
    const goals = f.goals;
    const league = f.league;

    const homeTeam = teams.home.name;
    const awayTeam = teams.away.name;
    const startTime = new Date(fixture.date || Date.now());

    let status = fallbackStatus;
    const shortStatus = fixture.status?.short;
    if (shortStatus === "FT" || shortStatus === "AET" || shortStatus === "PEN") {
      status = "FINISHED";
    } else if (["1H", "HT", "2H", "ET", "P", "LIVE"].includes(shortStatus)) {
      status = "LIVE";
    }

    const homeScore = goals.home ?? 0;
    const awayScore = goals.away ?? 0;

    const fixtureIdNum = typeof fixture.id === "number" ? fixture.id : 1000;
    const homeOdd = Number((1.60 + ((fixtureIdNum % 25) / 10)).toFixed(2));
    const drawOdd = Number((3.15 + ((fixtureIdNum % 15) / 10)).toFixed(2));
    const awayOdd = Number((2.15 + ((fixtureIdNum % 30) / 10)).toFixed(2));

    return {
      externalId: String(fixture.id),
      source: this.source,
      sportSlug: "futebol",
      sportName: "Futebol",
      competitionName: league.name || "Campeonato",
      competitionCountry: league.country || "Internacional",
      homeTeam,
      awayTeam,
      homeLogo: teams.home.logo || undefined,
      awayLogo: teams.away.logo || undefined,
      homeScore,
      awayScore,
      status,
      isLive: status === "LIVE",
      currentPeriod: fixture.status?.short ? `${fixture.status.short}` : undefined,
      currentMinute: fixture.status?.elapsed ? parseInt(fixture.status.elapsed, 10) : undefined,
      startTime,
      venue: fixture.venue?.name || undefined,
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
            { key: "OVER", label: "Mais de 2.5", value: 1.82 },
            { key: "UNDER", label: "Menos de 2.5", value: 1.98 },
          ],
        },
        {
          key: "BOTH_TEAMS_SCORE",
          name: "Ambas as Equipes Marcam",
          odds: [
            { key: "YES", label: "Sim", value: 1.72 },
            { key: "NO", label: "Não", value: 2.08 },
          ],
        },
      ],
      rawPayload: f,
    };
  }

  private normalizeBasketballGame(g: any): NormalizedSportEvent | null {
    if (!g || !g.teams?.home || !g.teams?.away) return null;

    const homeTeam = g.teams.home.name;
    const awayTeam = g.teams.away.name;
    const startTime = new Date(g.date || Date.now());

    let status: "UPCOMING" | "LIVE" | "FINISHED" = "UPCOMING";
    if (g.status?.short === "FT") {
      status = "FINISHED";
    } else if (g.status?.short && ["Q1", "Q2", "Q3", "Q4", "OT"].includes(g.status.short)) {
      status = "LIVE";
    }

    const homeScore = g.scores?.home?.total ?? 0;
    const awayScore = g.scores?.away?.total ?? 0;

    return {
      externalId: String(g.id),
      source: this.source,
      sportSlug: "basquete",
      sportName: "Basquete",
      competitionName: g.league?.name || "Liga de Basquete",
      competitionCountry: g.country?.name || "Internacional",
      homeTeam,
      awayTeam,
      homeLogo: g.teams.home.logo || undefined,
      awayLogo: g.teams.away.logo || undefined,
      homeScore,
      awayScore,
      status,
      isLive: status === "LIVE",
      currentPeriod: g.status?.short,
      startTime,
      lastSyncedAt: new Date(),
      markets: [
        {
          key: "MONEYLINE",
          name: "Vencedor do Jogo",
          odds: [
            { key: "1", label: homeTeam, value: 1.75 },
            { key: "2", label: awayTeam, value: 2.10 },
          ],
        },
        {
          key: "TOTAL_POINTS",
          name: "Total de Pontos (218.5)",
          odds: [
            { key: "OVER", label: "Mais de 218.5", value: 1.90 },
            { key: "UNDER", label: "Menos de 218.5", value: 1.90 },
          ],
        },
      ],
      rawPayload: g,
    };
  }
}
