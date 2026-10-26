import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { okResponse, errResponse } from "@/server/core/result";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const provider = searchParams.get("provider");
    const search = searchParams.get("search");
    const isFeatured = searchParams.get("featured") === "true";
    const isHot = searchParams.get("hot") === "true";
    const isOriginal = searchParams.get("original") === "true";

    const where: any = {};

    if (category && category !== "all") {
      where.category = { slug: category };
    }

    if (provider && provider !== "all") {
      where.provider = { code: provider };
    }

    if (search) {
      where.title = { contains: search };
    }

    if (isFeatured) where.isFeatured = true;
    if (isHot) where.isHot = true;
    if (isOriginal) where.isOriginal = true;

    const games = await prisma.game.findMany({
      where,
      include: {
        provider: {
          select: { code: true, name: true, status: true },
        },
        category: {
          select: { slug: true, name: true },
        },
      },
      orderBy: [{ isFeatured: "desc" }, { isHot: "desc" }, { timesPlayed: "desc" }],
    });

    return NextResponse.json(okResponse(games));
  } catch (error: any) {
    return NextResponse.json(errResponse(error.message), { status: 500 });
  }
}
