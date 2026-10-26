import { NextResponse } from "next/server";
import { okResponse, errResponse } from "@/server/core/result";
import { SportsDataGateway } from "@/server/modules/sports/sports-gateway.service";
import { SportsCacheService } from "@/server/modules/sports/sports-cache.service";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const gateway = SportsDataGateway.getInstance();
    const cache = SportsCacheService.getInstance();

    const [health, eventsCount, leaguesCount, lastLogs] = await Promise.all([
      gateway.getAllProvidersHealth(),
      prisma.sportEvent.count(),
      prisma.competition.count(),
      prisma.sportsSyncLog.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const cacheStats = cache.getStats();

    return NextResponse.json(
      okResponse({
        providers: health,
        stats: {
          totalEventsInDb: eventsCount,
          totalLeaguesInDb: leaguesCount,
          cache: cacheStats,
        },
        recentLogs: lastLogs,
      })
    );
  } catch (error: any) {
    return NextResponse.json(errResponse(error.message), { status: 500 });
  }
}
