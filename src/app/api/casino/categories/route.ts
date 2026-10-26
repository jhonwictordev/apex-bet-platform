import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { okResponse, errResponse } from "@/server/core/result";

export async function GET() {
  try {
    const categories = await prisma.gameCategory.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      include: {
        _count: {
          select: { games: true },
        },
      },
    });

    return NextResponse.json(okResponse(categories));
  } catch (error: any) {
    return NextResponse.json(errResponse(error.message), { status: 500 });
  }
}
