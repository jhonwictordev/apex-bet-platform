import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { okResponse, errResponse } from "@/server/core/result";
import { SportsCacheService } from "@/server/modules/sports/sports-cache.service";
import { SportsRateLimiterService } from "@/server/modules/sports/sports-rate-limiter.service";

export async function POST() {
  try {
    await requireAdminUser();
    const cache = SportsCacheService.getInstance();
    const rateLimiter = SportsRateLimiterService.getInstance();

    const clearedKeys = cache.invalidate();
    rateLimiter.resetQuota("THESPORTSDB");
    rateLimiter.resetQuota("OPENLIGADB");

    return NextResponse.json(
      okResponse({
        message: "Cache esportivo limpo com sucesso.",
        clearedKeys,
      })
    );
  } catch (error: any) {
    return NextResponse.json(errResponse(error.message), {
      status: error.message.includes("Não autorizado") ? 401 : 500,
    });
  }
}
