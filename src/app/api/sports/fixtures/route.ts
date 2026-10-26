import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { okResponse, errResponse } from "@/server/core/result";
import { SportsSyncWorker } from "@/server/modules/sports/sports-sync.worker";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sportSlug = searchParams.get("sport");
    const isLive = searchParams.get("live");
    const competition = searchParams.get("competition");

    // If database has 0 events, perform auto-sync from real sports APIs
    const count = await prisma.sportEvent.count();
    if (count === 0) {
      try {
        await SportsSyncWorker.getInstance().syncAll();
      } catch (syncErr) {
        console.warn("[Fixtures API] Auto-sync initial run failed:", syncErr);
      }
    }

    const where: any = {};
    if (sportSlug && sportSlug !== "all") {
      where.sport = { slug: sportSlug };
    }
    if (isLive === "true") {
      where.isLive = true;
    } else if (isLive === "false") {
      where.isLive = false;
    }
    if (competition) {
      where.competition = {
        name: { contains: competition },
      };
    }

    const fixtures = await prisma.sportEvent.findMany({
      where,
      include: {
        sport: true,
        competition: true,
        markets: {
          where: { status: "ACTIVE" },
          include: {
            odds: {
              where: { isActive: true },
            },
          },
        },
      },
      orderBy: [{ isLive: "desc" }, { startTime: "asc" }],
    });

    return NextResponse.json(okResponse(fixtures));
  } catch (error: any) {
    return NextResponse.json(errResponse(error.message), { status: 500 });
  }
}
