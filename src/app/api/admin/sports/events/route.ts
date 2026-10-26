import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SportsBetEngine } from "@/server/modules/sports/bet-engine.service";
import { okResponse, errResponse } from "@/server/core/result";
import { recordAuditLog } from "@/server/core/audit";

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminUser();
    const body = await req.json();
    const { sportSlug, competitionId, homeTeam, awayTeam, startTime, markets } = body;

    const sport = await prisma.sport.findUnique({ where: { slug: sportSlug } });
    if (!sport) {
      return NextResponse.json(errResponse("Modalidade esportiva não encontrada."), { status: 404 });
    }

    const event = await prisma.sportEvent.create({
      data: {
        sportId: sport.id,
        competitionId,
        homeTeam,
        awayTeam,
        startTime: new Date(startTime || Date.now() + 3600000),
        status: "UPCOMING",
        isLive: false,
      },
    });

    // Create default markets if provided or default 1X2
    const marketsToCreate = markets || [
      {
        key: "1X2",
        name: "Resultado Final (1X2)",
        odds: [
          { label: homeTeam, value: 2.1 },
          { label: "Empate", value: 3.2 },
          { label: awayTeam, value: 3.4 },
        ],
      },
    ];

    for (const m of marketsToCreate) {
      const createdMarket = await prisma.market.create({
        data: {
          eventId: event.id,
          key: m.key,
          name: m.name,
          status: "ACTIVE",
        },
      });

      for (const o of m.odds) {
        await prisma.odd.create({
          data: {
            marketId: createdMarket.id,
            label: o.label,
            value: o.value,
            isActive: true,
          },
        });
      }
    }

    await recordAuditLog({
      actorId: admin.userId,
      actorRole: admin.role,
      action: "CREATE_SPORT_EVENT",
      entity: "SPORT_EVENT",
      entityId: event.id,
      details: { homeTeam, awayTeam, sportSlug },
    });

    return NextResponse.json(okResponse(event, "Evento esportivo criado com sucesso!"));
  } catch (error: any) {
    const status = error.message.includes("FORBIDDEN") ? 403 : 500;
    return NextResponse.json(errResponse(error.message), { status });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdminUser();
    const body = await req.json();
    const { eventId, homeScore, awayScore, status, winningOddIds, isLive, currentPeriod, currentMinute } = body;

    if (!eventId) {
      return NextResponse.json(errResponse("ID do evento obrigatório."), { status: 400 });
    }

    const updatedEvent = await prisma.sportEvent.update({
      where: { id: eventId },
      data: {
        ...(homeScore !== undefined ? { homeScore: Number(homeScore) } : {}),
        ...(awayScore !== undefined ? { awayScore: Number(awayScore) } : {}),
        ...(status ? { status } : {}),
        ...(isLive !== undefined ? { isLive } : {}),
        ...(currentPeriod !== undefined ? { currentPeriod } : {}),
        ...(currentMinute !== undefined ? { currentMinute: Number(currentMinute) } : {}),
      },
    });

    // If winning odd IDs are provided, settle the event and affected bets!
    if (Array.isArray(winningOddIds) && winningOddIds.length > 0) {
      await SportsBetEngine.settleEvent(eventId, winningOddIds);
    }

    await recordAuditLog({
      actorId: admin.userId,
      actorRole: admin.role,
      action: "UPDATE_OR_SETTLE_SPORT_EVENT",
      entity: "SPORT_EVENT",
      entityId: eventId,
      details: { status, homeScore, awayScore, winningOddIdsCount: winningOddIds?.length || 0 },
    });

    return NextResponse.json(
      okResponse(updatedEvent, "Evento e apostas relacionadas processados com sucesso!")
    );
  } catch (error: any) {
    const status = error.message.includes("FORBIDDEN") ? 403 : 500;
    return NextResponse.json(errResponse(error.message), { status });
  }
}
