import { prisma } from "@/lib/db";
import { ISportsDataAdapter } from "./types";

export class SportsDataAdapter implements ISportsDataAdapter {
  private static instance: SportsDataAdapter;

  static getInstance(): SportsDataAdapter {
    if (!SportsDataAdapter.instance) {
      SportsDataAdapter.instance = new SportsDataAdapter();
    }
    return SportsDataAdapter.instance;
  }

  async getSports(): Promise<any[]> {
    return await prisma.sport.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      include: {
        _count: {
          select: { events: true },
        },
      },
    });
  }

  async getCompetitions(sportSlug?: string): Promise<any[]> {
    return await prisma.competition.findMany({
      where: {
        isActive: true,
        ...(sportSlug ? { sport: { slug: sportSlug } } : {}),
      },
      include: {
        sport: true,
      },
    });
  }

  async getFixtures(sportSlug?: string, isLive?: boolean): Promise<any[]> {
    return await prisma.sportEvent.findMany({
      where: {
        ...(isLive !== undefined ? { isLive } : {}),
        ...(sportSlug ? { sport: { slug: sportSlug } } : {}),
      },
      include: {
        sport: true,
        competition: true,
        markets: {
          include: {
            odds: true,
          },
        },
      },
      orderBy: [{ isLive: "desc" }, { startTime: "asc" }],
    });
  }

  async getScores(eventId: string): Promise<any> {
    const event = await prisma.sportEvent.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        homeTeam: true,
        awayTeam: true,
        homeScore: true,
        awayScore: true,
        isLive: true,
        currentMinute: true,
        currentPeriod: true,
        status: true,
      },
    });
    return event;
  }

  async getStatistics(eventId: string): Promise<any> {
    // Generates realistic demonstrative stats
    return {
      possession: { home: 54, away: 46 },
      shotsOnTarget: { home: 6, away: 4 },
      corners: { home: 5, away: 3 },
      yellowCards: { home: 2, away: 1 },
      attacks: { home: 88, away: 72 },
    };
  }

  async getLicensedOdds(eventId: string): Promise<any> {
    const markets = await prisma.market.findMany({
      where: { eventId, status: "ACTIVE" },
      include: { odds: true },
    });
    return markets;
  }
}
