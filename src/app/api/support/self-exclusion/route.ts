import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { okResponse, errResponse } from "@/server/core/result";
import { recordAuditLog } from "@/server/core/audit";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(errResponse("Não autenticado", "UNAUTHORIZED"), { status: 401 });
    }

    const body = await req.json();
    const { selfExclusionDays, sessionTimeLimitMinutes, dailyDepositLimit } = body;

    let selfExcludedUntil: Date | null = null;
    let isSelfExcluded = false;

    if (selfExclusionDays && Number(selfExclusionDays) > 0) {
      isSelfExcluded = true;
      selfExcludedUntil = new Date(Date.now() + Number(selfExclusionDays) * 24 * 60 * 60 * 1000);
    }

    const compliance = await prisma.complianceSettings.upsert({
      where: { userId: session.userId },
      create: {
        userId: session.userId,
        isSelfExcluded,
        selfExcludedUntil,
        sessionTimeLimitMinutes: sessionTimeLimitMinutes ? Number(sessionTimeLimitMinutes) : null,
        dailyDepositLimit: dailyDepositLimit ? Number(dailyDepositLimit) : null,
      },
      update: {
        ...(isSelfExcluded ? { isSelfExcluded, selfExcludedUntil } : {}),
        ...(sessionTimeLimitMinutes !== undefined
          ? { sessionTimeLimitMinutes: Number(sessionTimeLimitMinutes) }
          : {}),
        ...(dailyDepositLimit !== undefined ? { dailyDepositLimit: Number(dailyDepositLimit) } : {}),
      },
    });

    await recordAuditLog({
      actorId: session.userId,
      actorRole: session.role,
      action: "UPDATE_RESPONSIBLE_GAMING",
      entity: "COMPLIANCE",
      entityId: compliance.id,
      details: {
        isSelfExcluded,
        selfExcludedUntil,
        sessionTimeLimitMinutes,
      },
    });

    return NextResponse.json(
      okResponse(compliance, "Configurações de Jogo Responsável atualizadas com sucesso.")
    );
  } catch (error: any) {
    return NextResponse.json(errResponse(error.message), { status: 500 });
  }
}
