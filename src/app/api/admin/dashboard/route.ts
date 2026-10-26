import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { okResponse, errResponse } from "@/server/core/result";

export async function GET() {
  try {
    await requireAdminUser();

    const [
      totalUsers,
      totalBets,
      totalGameRounds,
      totalProviders,
      totalGames,
      activeLiveEvents,
      walletStats,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.bet.count(),
      prisma.demoGameRound.count(),
      prisma.provider.count(),
      prisma.game.count(),
      prisma.sportEvent.count({ where: { isLive: true } }),
      prisma.wallet.aggregate({
        _sum: {
          demoBalance: true,
          totalDepositedVirtual: true,
        },
      }),
    ]);

    const recentBets = await prisma.bet.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { username: true, email: true } },
        selections: true,
      },
    });

    const recentAuditLogs = await prisma.auditLog.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      okResponse({
        kpis: {
          totalUsers,
          totalBets,
          totalGameRounds,
          totalProviders,
          totalGames,
          activeLiveEvents,
          totalVirtualVolume: walletStats._sum.totalDepositedVirtual || 0,
          currentSystemVirtualBalance: walletStats._sum.demoBalance || 0,
        },
        recentBets,
        recentAuditLogs,
      })
    );
  } catch (error: any) {
    const status = error.message.includes("FORBIDDEN") ? 403 : 401;
    return NextResponse.json(errResponse(error.message), { status });
  }
}
