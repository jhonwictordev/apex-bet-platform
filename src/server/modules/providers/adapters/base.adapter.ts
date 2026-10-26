import crypto from "crypto";
import {
  CatalogSyncResult,
  GameLaunchRequest,
  GameLaunchResponse,
  IGameProviderAdapter,
  ProviderCode,
  ProviderCredentialsConfig,
  ProviderStatusInfo,
  ProviderStatusCode,
  StandardGameMetadata,
} from "../types";

export abstract class BaseProviderAdapter implements IGameProviderAdapter {
  abstract readonly code: ProviderCode;
  abstract readonly name: string;
  abstract readonly defaultCatalog: StandardGameMetadata[];

  async getProviderStatus(credentials?: ProviderCredentialsConfig): Promise<ProviderStatusInfo> {
    const isConfigured = Boolean(credentials?.apiKey && credentials?.apiKey.trim().length > 0);
    const status: ProviderStatusCode = isConfigured ? "CONFIGURED" : "AWAITING_CREDENTIALS";

    return {
      providerCode: this.code,
      name: this.name,
      status,
      statusLabel: isConfigured ? "Integração configurada" : "Aguardando credenciais",
      hasCredentials: isConfigured,
      environment: credentials?.environment || "SANDBOX",
      endpointConfigured: Boolean(credentials?.endpointUrl),
      gamesCount: this.defaultCatalog.length,
      lastHealthCheck: new Date().toISOString(),
      message: isConfigured
        ? "Pronto para comunicação com sandbox do provedor."
        : "Credenciais de API não configuradas no painel. Jogos operando em modo demonstrativo seguro.",
    };
  }

  async healthCheck(credentials?: ProviderCredentialsConfig): Promise<boolean> {
    if (!credentials?.apiKey) return false;
    // In live sandbox mode, ping endpoint if configured
    return true;
  }

  async getGames(credentials?: ProviderCredentialsConfig): Promise<StandardGameMetadata[]> {
    return this.defaultCatalog;
  }

  async getGameDetails(externalId: string, credentials?: ProviderCredentialsConfig): Promise<StandardGameMetadata | null> {
    const game = this.defaultCatalog.find((g) => g.externalId === externalId || g.slug === externalId);
    return game || null;
  }

  async getAuthorizedDemoLaunch(
    request: GameLaunchRequest,
    credentials?: ProviderCredentialsConfig
  ): Promise<GameLaunchResponse> {
    const game = await this.getGameDetails(request.slug, credentials);
    const sessionToken = `demo_${this.code}_${crypto.randomUUID()}`;

    // If official demo sandbox URL is available and credentials exist
    if (credentials?.apiKey && credentials?.endpointUrl && game?.demoUrl) {
      return {
        success: true,
        sessionToken,
        launchUrl: `${credentials.endpointUrl}/demo-launcher?token=${sessionToken}&gameId=${game.externalId}`,
        isIframe: true,
        isOfficialSandbox: true,
        provider: this.code,
        gameTitle: game.title,
      };
    }

    // High quality demonstrative simulator fallback
    return {
      success: true,
      sessionToken,
      launchUrl: `/cassino/demo-frame?provider=${this.code}&game=${request.slug}&token=${sessionToken}`,
      isIframe: true,
      isOfficialSandbox: false,
      provider: this.code,
      gameTitle: game ? game.title : request.slug,
      message: "Modo demonstrativo simulado ativo com créditos virtuais.",
    };
  }

  async createDemoSession(
    request: GameLaunchRequest,
    credentials?: ProviderCredentialsConfig
  ): Promise<{ sessionToken: string; launchUrl: string }> {
    const launch = await this.getAuthorizedDemoLaunch(request, credentials);
    return {
      sessionToken: launch.sessionToken,
      launchUrl: launch.launchUrl,
    };
  }

  async closeDemoSession(sessionToken: string): Promise<boolean> {
    return true;
  }

  async synchronizeCatalog(credentials?: ProviderCredentialsConfig): Promise<CatalogSyncResult> {
    const games = await this.getGames(credentials);
    return {
      providerCode: this.code,
      status: "SUCCESS",
      totalFound: games.length,
      addedCount: games.length,
      updatedCount: 0,
    };
  }

  validateCallback(signature: string, payload: any, secret?: string): boolean {
    if (!secret) return false;
    const bodyString = typeof payload === "string" ? payload : JSON.stringify(payload);
    const expected = crypto.createHmac("sha256", secret).update(bodyString).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  }
}
