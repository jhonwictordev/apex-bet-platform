import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { okResponse, errResponse } from "@/server/core/result";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(errResponse("Não autenticado", "UNAUTHORIZED"), { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        wallet: true,
        compliance: true,
      },
    });

    if (!user) {
      return NextResponse.json(errResponse("Usuário não encontrado", "NOT_FOUND"), { status: 404 });
    }

    return NextResponse.json(
      okResponse({
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isSuspended: user.isSuspended,
        wallet: user.wallet,
        compliance: user.compliance,
      })
    );
  } catch (error: any) {
    return NextResponse.json(errResponse(error.message), { status: 500 });
  }
}
