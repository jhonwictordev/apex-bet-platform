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
