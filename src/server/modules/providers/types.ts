export type ProviderCode =
  | "pragmatic"
  | "pgsoft"
  | "evolution"
  | "spribe"
  | "bgaming"
  | "netent"
  | "playtech"
  | "aggregator"
  | "inhouse";

export type ProviderStatusCode =
  | "AVAILABLE_DEMO"
  | "CONFIGURED"
  | "AWAITING_CREDENTIALS"
  | "AWAITING_AUTHORIZATION"
  | "REGION_RESTRICTED"
  | "TEMPORARILY_UNAVAILABLE";

export interface ProviderStatusInfo {
  providerCode: ProviderCode;
  name: string;
  status: ProviderStatusCode;
  statusLabel: string;
  hasCredentials: boolean;
  environment: "SANDBOX" | "PRODUCTION";
  endpointConfigured: boolean;
  gamesCount: number;
  lastHealthCheck?: string;
  message?: string;
}

export interface ProviderCredentialsConfig {
  apiKey?: string;
  apiSecret?: string;
  endpointUrl?: string;
  environment: "SANDBOX" | "PRODUCTION";
  ipWhitelist?: string;
}

export interface StandardGameMetadata {
  externalId: string;
  slug: string;
  title: string;
  category: string;
  providerCode: ProviderCode;
  thumbnail: string;
  bannerUrl?: string;
  rtp: number;
  volatility: "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";
  minBet: number;
  maxBet: number;
  isDemoAvailable: boolean;
  status: ProviderStatusCode;
  demoUrl?: string;
}

export interface GameLaunchRequest {
  gameId: string;
  slug: string;
  userId: string;
  username: string;
  currency: string;
  language?: string;
  ipAddress?: string;
}

export interface GameLaunchResponse {
  success: boolean;
  sessionToken: string;
  launchUrl: string;
  isIframe: boolean;
  isOfficialSandbox: boolean;
  provider: ProviderCode;
  gameTitle: string;
  message?: string;
}

export interface CatalogSyncResult {
  providerCode: ProviderCode;
  status: "SUCCESS" | "FAILURE";
  totalFound: number;
  addedCount: number;
  updatedCount: number;
  error?: string;
}

export interface IGameProviderAdapter {
  readonly code: ProviderCode;
  readonly name: string;

  getProviderStatus(credentials?: ProviderCredentialsConfig): Promise<ProviderStatusInfo>;
  healthCheck(credentials?: ProviderCredentialsConfig): Promise<boolean>;
  getGames(credentials?: ProviderCredentialsConfig): Promise<StandardGameMetadata[]>;
  getGameDetails(externalId: string, credentials?: ProviderCredentialsConfig): Promise<StandardGameMetadata | null>;
  getAuthorizedDemoLaunch(request: GameLaunchRequest, credentials?: ProviderCredentialsConfig): Promise<GameLaunchResponse>;
  createDemoSession(request: GameLaunchRequest, credentials?: ProviderCredentialsConfig): Promise<{ sessionToken: string; launchUrl: string }>;
  closeDemoSession(sessionToken: string): Promise<boolean>;
  synchronizeCatalog(credentials?: ProviderCredentialsConfig): Promise<CatalogSyncResult>;
  validateCallback(signature: string, payload: any, secret?: string): boolean;
}
