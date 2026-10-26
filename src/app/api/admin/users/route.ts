import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { okResponse, errResponse } from "@/server/core/result";
import { recordAuditLog } from "@/server/core/audit";

export async function GET(req: NextRequest) {
  try {
    await requireAdminUser();
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || "";

    const users = await prisma.user.findMany({
      where: query
        ? {
            OR: [
              { email: { contains: query } },
              { username: { contains: query } },
            ],
          }
        : {},
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isSuspended: true,
        suspensionReason: true,
        createdAt: true,
        wallet: {
          select: {
            demoBalance: true,
            totalDepositedVirtual: true,
            totalWithdrawnVirtual: true,
          },
        },
        _count: {
          select: {
            bets: true,
            gameRounds: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(okResponse(users));
  } catch (error: any) {
    const status = error.message.includes("FORBIDDEN") ? 403 : 500;
    return NextResponse.json(errResponse(error.message), { status });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdminUser();
    const body = await req.json();
    const { userId, role, isSuspended, suspensionReason } = body;

    if (!userId) {
      return NextResponse.json(errResponse("ID do usuário obrigatório."), { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(role ? { role } : {}),
        ...(isSuspended !== undefined ? { isSuspended, suspensionReason } : {}),
      },
    });

    await recordAuditLog({
      actorId: admin.userId,
      actorRole: admin.role,
      action: "UPDATE_USER_PERMISSIONS_OR_STATUS",
      entity: "USER",
      entityId: userId,
      details: { role, isSuspended, suspensionReason },
    });

    return NextResponse.json(okResponse(updated, "Status do usuário atualizado com sucesso."));
  } catch (error: any) {
    const status = error.message.includes("FORBIDDEN") ? 403 : 500;
    return NextResponse.json(errResponse(error.message), { status });
  }
}
