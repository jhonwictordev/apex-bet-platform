import {
  ISportsProviderAdapter,
  NormalizedLeague,
  NormalizedSportEvent,
  ProviderHealth,
  SportsDataSource,
} from "./types";
import { TheSportsDBAdapter } from "./thesportsdb.adapter";
import { OpenLigaDBAdapter } from "./openligadb.adapter";
import { ApiSportsAdapter } from "./api-sports.adapter";
import { SportsDeduplicator } from "./sports-deduplicator";

export class SportsDataGateway {
  private static instance: SportsDataGateway;

  private theSportsDb: TheSportsDBAdapter;
  private openLigaDb: OpenLigaDBAdapter;
  private apiSports: ApiSportsAdapter;

  constructor() {
    this.theSportsDb = new TheSportsDBAdapter();
    this.openLigaDb = new OpenLigaDBAdapter();
    this.apiSports = new ApiSportsAdapter();
  }

  static getInstance(): SportsDataGateway {
    if (!SportsDataGateway.instance) {
      SportsDataGateway.instance = new SportsDataGateway();
    }
    return SportsDataGateway.instance;
  }

  getAdapter(source: SportsDataSource): ISportsProviderAdapter {
    switch (source) {
      case "THESPORTSDB":
        return this.theSportsDb;
      case "OPENLIGADB":
        return this.openLigaDb;
      case "API_SPORTS":
        return this.apiSports;
      default:
        return this.theSportsDb;
    }
  }

  getApiSportsAdapter(): ApiSportsAdapter {
    return this.apiSports;
  }

  /**
   * Health checks across all 3 providers
   */
  async getAllProvidersHealth(): Promise<Record<SportsDataSource, ProviderHealth>> {
    const [theSportsDbHealth, openLigaDbHealth, apiSportsHealth] = await Promise.all([
      this.theSportsDb.getHealth(),
      this.openLigaDb.getHealth(),
      this.apiSports.getHealth(),
    ]);

    return {
      THESPORTSDB: theSportsDbHealth,
      OPENLIGADB: openLigaDbHealth,
      API_SPORTS: apiSportsHealth,
      IN_HOUSE: {
        source: "IN_HOUSE",
        name: "Apex Internal Engine",
        isAvailable: true,
        isConfigured: true,
        latencyMs: 1,
        lastCheckedAt: new Date(),
        dailyRequestsUsed: 0,
        dailyRequestsLimit: 999999,
        requiresKey: false,
        keyConfigured: true,
        message: "Motor interno ativo",
      },
    };
  }

  /**
   * Fetches unified leagues from all active sources
   */
  async getAllLeagues(): Promise<NormalizedLeague[]> {
    const [tsdbLeagues, openLigaLeagues, apiSportsLeagues] = await Promise.all([
      this.theSportsDb.fetchLeagues().catch(() => []),
      this.openLigaDb.fetchLeagues().catch(() => []),
      this.apiSports.fetchLeagues().catch(() => []),
    ]);

    const combined = [...apiSportsLeagues, ...openLigaLeagues, ...tsdbLeagues];
    // Deduplicate leagues by name
    const seen = new Set<string>();
    return combined.filter((l) => {
      const key = l.name.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Fetches live matches according to source priority:
   * 1. API-SPORTS (if active)
   * 2. OpenLigaDB
   * 3. TheSportsDB
   */
  async getLiveMatches(): Promise<NormalizedSportEvent[]> {
    const apiSportsHealth = await this.apiSports.getHealth();
    const tasks: Promise<NormalizedSportEvent[]>[] = [];

    if (apiSportsHealth.isConfigured && apiSportsHealth.isAvailable) {
      tasks.push(this.apiSports.fetchLiveFixtures().catch(() => []));
    }
    tasks.push(this.openLigaDb.fetchLiveFixtures().catch(() => []));
    tasks.push(this.theSportsDb.fetchLiveFixtures().catch(() => []));

    const results = await Promise.all(tasks);
    const flattened = results.flat();

    return SportsDeduplicator.deduplicate(flattened, ["API_SPORTS", "OPENLIGADB", "THESPORTSDB"]);
  }

  /**
   * Fetches upcoming fixtures with strict priority:
   * Brazilian football: API-SPORTS -> TheSportsDB -> OpenLigaDB
   * International: API-SPORTS -> OpenLigaDB -> TheSportsDB
   * Other sports: API-SPORTS -> TheSportsDB
   */
  async getUpcomingFixtures(options?: {
    sportSlug?: string;
    isBrazilian?: boolean;
    limit?: number;
  }): Promise<NormalizedSportEvent[]> {
    const limit = options?.limit || 30;
    const isBrazilian = options?.isBrazilian;
    const sportSlug = options?.sportSlug;

    const apiSportsHealth = await this.apiSports.getHealth();
    const allEvents: NormalizedSportEvent[] = [];

    // Priority 1: API-SPORTS if configured
    if (apiSportsHealth.isConfigured && apiSportsHealth.isAvailable) {
      try {
        if (isBrazilian) {
          const brEvents = await this.apiSports.fetchBrazilianFixtures(71); // Série A
          allEvents.push(...brEvents);
        } else if (sportSlug === "basquete") {
          const bball = await this.apiSports.fetchBasketballFixtures();
          allEvents.push(...bball);
        } else {
          const upcoming = await this.apiSports.fetchUpcomingFixtures(limit);
          allEvents.push(...upcoming);
        }
      } catch (err) {
        console.warn("[Gateway] API-SPORTS fetch error:", err);
      }
    }

    // Priority 2: OpenLigaDB for European Football (Bundesliga, DFB, etc.)
    if (!isBrazilian && (!sportSlug || sportSlug === "futebol")) {
      try {
        const openLigaEvents = await this.openLigaDb.fetchUpcomingFixtures(limit);
        allEvents.push(...openLigaEvents);
      } catch (err) {
        console.warn("[Gateway] OpenLigaDB fetch error:", err);
      }
    }

    // Priority 3: TheSportsDB (Premier League, Serie A, and Brazilian coverage)
    try {
      if (isBrazilian) {
        const tsdbBr = await this.theSportsDb.fetchBrazilianFixtures(limit);
        allEvents.push(...tsdbBr);
      } else {
        const tsdbEvents = await this.theSportsDb.fetchUpcomingFixtures(limit);
        allEvents.push(...tsdbEvents);
      }
    } catch (err) {
      console.warn("[Gateway] TheSportsDB fetch error:", err);
    }

    // Deduplicate respecting priority
    const priorityOrder = isBrazilian
      ? ["API_SPORTS", "THESPORTSDB", "OPENLIGADB"]
      : ["API_SPORTS", "OPENLIGADB", "THESPORTSDB"];

    const deduplicated = SportsDeduplicator.deduplicate(allEvents, priorityOrder);

    // Filter by sport if provided
    let filtered = deduplicated;
    if (sportSlug) {
      filtered = filtered.filter((e) => e.sportSlug === sportSlug);
    }

    return filtered.slice(0, limit);
  }

  /**
   * Fetches recent results
   */
  async getResults(limit: number = 20): Promise<NormalizedSportEvent[]> {
    const [openLigaResults, tsdbResults] = await Promise.all([
      this.openLigaDb.fetchResults(limit).catch(() => []),
      this.theSportsDb.fetchResults(limit).catch(() => []),
    ]);

    const combined = [...openLigaResults, ...tsdbResults];
    return SportsDeduplicator.deduplicate(combined, ["OPENLIGADB", "THESPORTSDB"]).slice(0, limit);
  }
}
