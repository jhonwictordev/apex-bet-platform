import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { okResponse, errResponse } from "@/server/core/result";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sportSlug = searchParams.get("sport");
    const isLive = searchParams.get("live");

    const where: any = {};
    if (sportSlug && sportSlug !== "all") {
      where.sport = { slug: sportSlug };
    }
    if (isLive === "true") {
      where.isLive = true;
    } else if (isLive === "false") {
      where.isLive = false;
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
