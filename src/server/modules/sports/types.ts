// Sports Module Unified Types & Interfaces

export type SportsDataSource = "THESPORTSDB" | "OPENLIGADB" | "API_SPORTS" | "IN_HOUSE";

export interface NormalizedTeam {
  id?: string;
  name: string;
  shortName?: string;
  logoUrl?: string;
  country?: string;
}

export interface NormalizedLeague {
  id: string;
  name: string;
  country: string;
  sportSlug: string;
  logoUrl?: string;
  source: SportsDataSource;
  externalId?: string;
}

export interface NormalizedScore {
  home: number;
  away: number;
  period?: string;
  minute?: number;
}

export interface NormalizedOdd {
  key: string;       // "1", "X", "2", "OVER", "UNDER", "YES", "NO"
  label: string;
  value: number;
}

export interface NormalizedMarket {
  key: string;       // "1X2", "OVER_UNDER_2_5", "BOTH_TEAMS_SCORE"
  name: string;
  odds: NormalizedOdd[];
}

export interface NormalizedSportEvent {
  externalId: string;
  source: SportsDataSource;
  sportSlug: string;       // "futebol", "basquete", etc.
  sportName: string;       // "Futebol", "Basquete"
  competitionName: string;
  competitionCountry: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo?: string;
  awayLogo?: string;
  homeScore: number;
  awayScore: number;
  status: "UPCOMING" | "LIVE" | "FINISHED" | "CANCELLED" | "POSTPONED";
  isLive: boolean;
  currentPeriod?: string;
  currentMinute?: number;
  startTime: Date;
  venue?: string;
  markets: NormalizedMarket[];
  lastSyncedAt: Date;
  rawPayload?: any;
}

export interface ProviderHealth {
  source: SportsDataSource;
  name: string;
  isAvailable: boolean;
  isConfigured: boolean;
  latencyMs: number;
  lastCheckedAt: Date;
  dailyRequestsUsed: number;
  dailyRequestsLimit: number;
  requiresKey: boolean;
  keyConfigured: boolean;
  message?: string;
  signupUrl?: string;
}

export interface ISportsProviderAdapter {
  readonly source: SportsDataSource;
  readonly name: string;
  getHealth(): Promise<ProviderHealth>;
  fetchLeagues(): Promise<NormalizedLeague[]>;
  fetchLiveFixtures(): Promise<NormalizedSportEvent[]>;
  fetchUpcomingFixtures(limit?: number): Promise<NormalizedSportEvent[]>;
  fetchResults(limit?: number): Promise<NormalizedSportEvent[]>;
}

export interface BetSelectionInput {
  eventId: string;
  marketId: string;
  oddId: string;
  eventName: string;
  marketName: string;
  selectionLabel: string;
  oddValue: number;
}

export interface PlaceBetRequest {
  userId: string;
  type: "SINGLE" | "MULTIPLE";
  stake: number;
  selections: BetSelectionInput[];
}

export interface SettleBetResult {
  betId: string;
  status: "WON" | "LOST" | "VOID";
  actualReturn: number;
  payoutCredited: boolean;
}

export interface ISportsDataAdapter {
  getSports(): Promise<any[]>;
  getCompetitions(sportSlug?: string): Promise<any[]>;
  getFixtures(sportSlug?: string, isLive?: boolean): Promise<any[]>;
  getScores(eventId: string): Promise<any>;
  getStatistics(eventId: string): Promise<any>;
  getLicensedOdds(eventId: string): Promise<any>;
}
