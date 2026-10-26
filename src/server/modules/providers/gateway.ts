import { prisma } from "@/lib/db";
import { ProviderRegistry } from "./registry";
import {
  CatalogSyncResult,
  GameLaunchRequest,
  GameLaunchResponse,
  ProviderCode,
  ProviderCredentialsConfig,
  ProviderStatusInfo,
} from "./types";
import { recordAuditLog } from "@/server/core/audit";

export class GameIntegrationGateway {
  private static registry = ProviderRegistry.getInstance();

  /**
   * Retrieves provider status including database credentials status.
   */
  static async getProviderStatus(code: ProviderCode): Promise<ProviderStatusInfo> {
    const adapter = this.registry.get(code);
    if (!adapter) {
      throw new Error(`Provedor desconhecido: ${code}`);
    }

    const dbProvider = await prisma.provider.findUnique({
      where: { code },
      include: { credentials: true },
    });

    const credentials: ProviderCredentialsConfig | undefined = dbProvider?.credentials
      ? {
          apiKey: dbProvider.credentials.apiKey || undefined,
          apiSecret: dbProvider.credentials.apiSecret || undefined,
          endpointUrl: dbProvider.credentials.endpointUrl || undefined,
          environment: (dbProvider.credentials.environment as "SANDBOX" | "PRODUCTION") || "SANDBOX",
          ipWhitelist: dbProvider.credentials.ipWhitelist || undefined,
        }
      : undefined;

    return await adapter.getProviderStatus(credentials);
  }

  /**
   * Lists all registered providers with live connection and catalog status.
   */
  static async listAllProvidersStatus(): Promise<ProviderStatusInfo[]> {
    const adapters = this.registry.getAll();
    const statuses: ProviderStatusInfo[] = [];

    for (const adapter of adapters) {
      const status = await this.getProviderStatus(adapter.code);
      statuses.push(status);
    }

    return statuses;
  }

  /**
   * Tests connection with provider sandbox or endpoint.
   */
  static async testConnection(
    code: ProviderCode
  ): Promise<{ success: boolean; message: string; testedAt: string }> {
    const adapter = this.registry.get(code);
    if (!adapter) {
      throw new Error(`Provedor desconhecido: ${code}`);
    }

    const dbProvider = await prisma.provider.findUnique({
      where: { code },
      include: { credentials: true },
    });

    const credentials: ProviderCredentialsConfig | undefined = dbProvider?.credentials
      ? {
          apiKey: dbProvider.credentials.apiKey || undefined,
          apiSecret: dbProvider.credentials.apiSecret || undefined,
          endpointUrl: dbProvider.credentials.endpointUrl || undefined,
          environment: (dbProvider.credentials.environment as "SANDBOX" | "PRODUCTION") || "SANDBOX",
        }
      : undefined;

    const isHealthy = await adapter.healthCheck(credentials);
    const testedAt = new Date().toISOString();
    const message = isHealthy
      ? "Conexão com sandbox autorizada estabelecida com sucesso."
      : "Endpoint sandbox sem resposta ou credenciais de demonstração ausentes. Modo simulador ativo.";

    if (dbProvider?.credentials) {
      await prisma.providerCredentials.update({
        where: { id: dbProvider.credentials.id },
        data: {
          lastTestedAt: new Date(),
          testStatus: isHealthy ? "SUCCESS" : "FAILED",
          testMessage: message,
        },
      });
    }

    return {
      success: isHealthy,
      message,
      testedAt,
    };
  }

  /**
   * Synchronizes catalog of games from the provider into the database.
   */
  static async syncCatalog(code: ProviderCode): Promise<CatalogSyncResult> {
    const adapter = this.registry.get(code);
    if (!adapter) {
      throw new Error(`Provedor desconhecido: ${code}`);
    }

    let dbProvider = await prisma.provider.findUnique({
      where: { code },
      include: { credentials: true },
    });

    if (!dbProvider) {
      dbProvider = await prisma.provider.create({
        data: {
          code,
          name: adapter.name,
          status: "AVAILABLE_DEMO",
          isEnabled: true,
        },
        include: { credentials: true },
      });
    }

    const credentials: ProviderCredentialsConfig | undefined = dbProvider.credentials
      ? {
          apiKey: dbProvider.credentials.apiKey || undefined,
          apiSecret: dbProvider.credentials.apiSecret || undefined,
          endpointUrl: dbProvider.credentials.endpointUrl || undefined,
          environment: (dbProvider.credentials.environment as "SANDBOX" | "PRODUCTION") || "SANDBOX",
        }
      : undefined;

    try {
      const syncResult = await adapter.synchronizeCatalog(credentials);
      const catalogGames = await adapter.getGames(credentials);

      // Upsert games into DB
      for (const game of catalogGames) {
        // Ensure category exists
        let category = await prisma.gameCategory.findUnique({
          where: { slug: game.category },
        });

        if (!category) {
          category = await prisma.gameCategory.create({
            data: {
              slug: game.category,
              name: game.category.toUpperCase(),
            },
          });
        }

        await prisma.game.upsert({
          where: { slug: game.slug },
          update: {
            title: game.title,
            rtp: game.rtp,
            volatility: game.volatility,
            minBet: game.minBet,
            maxBet: game.maxBet,
            thumbnail: game.thumbnail,
            bannerUrl: game.bannerUrl,
            status: game.status,
            isDemoAvailable: game.isDemoAvailable,
          },
          create: {
            providerId: dbProvider.id,
            externalId: game.externalId,
            slug: game.slug,
            title: game.title,
            categoryId: category.id,
            thumbnail: game.thumbnail,
            bannerUrl: game.bannerUrl,
            rtp: game.rtp,
            volatility: game.volatility,
            minBet: game.minBet,
            maxBet: game.maxBet,
            status: game.status,
            isDemoAvailable: game.isDemoAvailable,
            isOriginal: code === "inhouse",
          },
        });
      }

      // Record sync log
      await prisma.providerSyncLog.create({
        data: {
          providerId: dbProvider.id,
          status: "SUCCESS",
          totalGamesFound: syncResult.totalFound,
          newGamesAdded: syncResult.addedCount,
          updatedGames: syncResult.updatedCount,
        },
      });

      return syncResult;
    } catch (error: any) {
      await prisma.providerSyncLog.create({
        data: {
          providerId: dbProvider.id,
          status: "FAILURE",
          errorMessage: error.message || "Erro desconhecido na sincronização",
        },
      });

      return {
        providerCode: code,
        status: "FAILURE",
        totalFound: 0,
        addedCount: 0,
        updatedCount: 0,
        error: error.message,
      };
    }
  }

  /**
   * Initializes a safe authorized demo session and returns client launcher URL.
   */
  static async launchDemoSession(request: GameLaunchRequest): Promise<GameLaunchResponse> {
    const game = await prisma.game.findUnique({
      where: { slug: request.slug },
      include: { provider: { include: { credentials: true } } },
    });

    if (!game) {
      throw new Error(`Jogo não encontrado: ${request.slug}`);
    }

    const providerCode = game.provider.code as ProviderCode;
    const adapter = this.registry.get(providerCode);
    if (!adapter) {
      throw new Error(`Adaptador não encontrado para provedor: ${providerCode}`);
    }

    const credentials: ProviderCredentialsConfig | undefined = game.provider.credentials
      ? {
          apiKey: game.provider.credentials.apiKey || undefined,
          apiSecret: game.provider.credentials.apiSecret || undefined,
          endpointUrl: game.provider.credentials.endpointUrl || undefined,
          environment: (game.provider.credentials.environment as "SANDBOX" | "PRODUCTION") || "SANDBOX",
        }
      : undefined;

    const launch = await adapter.getAuthorizedDemoLaunch(request, credentials);

    // Save GameSession in database
    await prisma.gameSession.create({
      data: {
        userId: request.userId,
        gameId: game.id,
        sessionToken: launch.sessionToken,
        status: "ACTIVE",
      },
    });

    // Update game timesPlayed
    await prisma.game.update({
      where: { id: game.id },
      data: { timesPlayed: { increment: 1 } },
    });

    await recordAuditLog({
      actorId: request.userId,
      action: "LAUNCH_DEMO_GAME",
      entity: "GAME",
      entityId: game.id,
      details: {
        slug: game.slug,
        provider: providerCode,
        sessionToken: launch.sessionToken,
      },
    });

    return launch;
  }
}
