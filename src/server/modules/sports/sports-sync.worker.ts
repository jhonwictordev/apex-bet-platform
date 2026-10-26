import { prisma } from "@/lib/db";
import { SportsDataGateway } from "./sports-gateway.service";
import { NormalizedSportEvent } from "./types";

export interface SyncStats {
  source: string;
  totalFetched: number;
  totalSaved: number;
  durationMs: number;
  timestamp: Date;
  status: "SUCCESS" | "PARTIAL" | "ERROR";
  error?: string;
}

export class SportsSyncWorker {
  private static instance: SportsSyncWorker;
  private gateway: SportsDataGateway;
  private isSyncing = false;

  constructor() {
    this.gateway = SportsDataGateway.getInstance();
  }

  static getInstance(): SportsSyncWorker {
    if (!SportsSyncWorker.instance) {
      SportsSyncWorker.instance = new SportsSyncWorker();
    }
    return SportsSyncWorker.instance;
  }

  /**
   * Performs full synchronization from real external APIs
   */
  async syncAll(): Promise<SyncStats> {
    if (this.isSyncing) {
      return {
        source: "ALL",
        totalFetched: 0,
        totalSaved: 0,
        durationMs: 0,
        timestamp: new Date(),
        status: "SUCCESS",
      };
    }

    this.isSyncing = true;
    const startTime = Date.now();

    try {
      // 1. Fetch upcoming and live fixtures from Gateway
      const [upcoming, live, results] = await Promise.all([
        this.gateway.getUpcomingFixtures({ limit: 40 }),
        this.gateway.getLiveMatches(),
        this.gateway.getResults(20),
      ]);

      const allEvents = [...live, ...upcoming, ...results];
      let savedCount = 0;

      for (const event of allEvents) {
        try {
          await this.saveNormalizedEvent(event);
          savedCount++;
        } catch (err: any) {
          console.error(`[SportsSync] Failed to save event ${event.homeTeam} vs ${event.awayTeam}:`, err?.message);
        }
      }

      const durationMs = Date.now() - startTime;

      // Record log in database
      await prisma.sportsSyncLog.create({
        data: {
          source: "GATEWAY_ALL",
          endpoint: "syncAll",
          status: "SUCCESS",
          recordsFetched: allEvents.length,
          recordsSaved: savedCount,
          durationMs,
        },
      });

      return {
        source: "ALL",
        totalFetched: allEvents.length,
        totalSaved: savedCount,
        durationMs,
        timestamp: new Date(),
        status: "SUCCESS",
      };
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      await prisma.sportsSyncLog.create({
        data: {
          source: "GATEWAY_ALL",
          endpoint: "syncAll",
          status: "ERROR",
          recordsFetched: 0,
          recordsSaved: 0,
          durationMs,
          errorMessage: err?.message || String(err),
        },
      });

      return {
        source: "ALL",
        totalFetched: 0,
        totalSaved: 0,
        durationMs,
        timestamp: new Date(),
        status: "ERROR",
        error: err?.message || String(err),
      };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Persists normalized event and its betting markets in the database
   */
  async saveNormalizedEvent(event: NormalizedSportEvent): Promise<string> {
    // 1. Ensure Sport exists
    const sportSlug = event.sportSlug || "futebol";
    const sport = await prisma.sport.upsert({
      where: { slug: sportSlug },
      update: { name: event.sportName || "Futebol" },
      create: {
        slug: sportSlug,
        name: event.sportName || "Futebol",
        icon: sportSlug === "basquete" ? "Basketball" : "Trophy",
        order: sportSlug === "futebol" ? 1 : 2,
        isActive: true,
      },
    });

    // 2. Ensure Competition exists
    let competition = await prisma.competition.findFirst({
      where: {
        sportId: sport.id,
        name: event.competitionName,
      },
    });

    if (!competition) {
      competition = await prisma.competition.create({
        data: {
          sportId: sport.id,
          name: event.competitionName,
          country: event.competitionCountry || "Internacional",
          externalId: event.externalId,
          externalSource: event.source,
          isActive: true,
        },
      });
    }

    // 3. Find existing match by externalId & source OR fuzzy match (same teams & date)
    let existing = await prisma.sportEvent.findFirst({
      where: {
        externalId: event.externalId,
        externalSource: event.source,
      },
      include: { markets: { include: { odds: true } } },
    });

    if (!existing) {
      // Check if match already exists by team names
      const dateMin = new Date(new Date(event.startTime).getTime() - 12 * 3600 * 1000);
      const dateMax = new Date(new Date(event.startTime).getTime() + 12 * 3600 * 1000);

      existing = await prisma.sportEvent.findFirst({
        where: {
          competitionId: competition.id,
          homeTeam: event.homeTeam,
          awayTeam: event.awayTeam,
          startTime: { gte: dateMin, lte: dateMax },
        },
        include: { markets: { include: { odds: true } } },
      });
    }

    let eventId: string;

    if (existing) {
      eventId = existing.id;
      await prisma.sportEvent.update({
        where: { id: existing.id },
        data: {
          homeScore: event.homeScore,
          awayScore: event.awayScore,
          status: event.status,
          isLive: event.isLive,
          currentPeriod: event.currentPeriod,
          currentMinute: event.currentMinute,
          homeLogo: event.homeLogo || existing.homeLogo,
          awayLogo: event.awayLogo || existing.awayLogo,
          lastSyncedAt: new Date(),
          rawPayload: event.rawPayload ? JSON.stringify(event.rawPayload) : undefined,
        },
      });
    } else {
      const created = await prisma.sportEvent.create({
        data: {
          competitionId: competition.id,
          sportId: sport.id,
          externalId: event.externalId,
          externalSource: event.source,
          homeTeam: event.homeTeam,
          awayTeam: event.awayTeam,
          homeLogo: event.homeLogo,
          awayLogo: event.awayLogo,
          homeScore: event.homeScore,
          awayScore: event.awayScore,
          status: event.status,
          isLive: event.isLive,
          currentPeriod: event.currentPeriod,
          currentMinute: event.currentMinute,
          startTime: new Date(event.startTime),
          lastSyncedAt: new Date(),
          rawPayload: event.rawPayload ? JSON.stringify(event.rawPayload) : undefined,
        },
      });
      eventId = created.id;
    }

    // 4. Ensure Markets and Odds exist for betting
    for (const mkt of event.markets) {
      let market = await prisma.market.findFirst({
        where: {
          eventId,
          key: mkt.key,
        },
        include: { odds: true },
      });

      if (!market) {
        market = await prisma.market.create({
          data: {
            eventId,
            key: mkt.key,
            name: mkt.name,
            status: "ACTIVE",
          },
          include: { odds: true },
        });

        // Create odds
        for (const odd of mkt.odds) {
          await prisma.odd.create({
            data: {
              marketId: market.id,
              label: odd.label,
              value: odd.value,
              isActive: true,
            },
          });
        }
      } else {
        // Update odds values if market exists
        for (const odd of mkt.odds) {
          const existingOdd = market.odds.find((o) => o.label === odd.label);
          if (existingOdd) {
            await prisma.odd.update({
              where: { id: existingOdd.id },
              data: { value: odd.value, isActive: true },
            });
          } else {
            await prisma.odd.create({
              data: {
                marketId: market.id,
                label: odd.label,
                value: odd.value,
                isActive: true,
              },
            });
          }
        }
      }
    }

    return eventId;
  }

  /**
   * Returns recent sync logs
   */
  async getSyncLogs(limit: number = 20) {
    return await prisma.sportsSyncLog.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
    });
  }
}
