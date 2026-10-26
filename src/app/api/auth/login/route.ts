import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createToken, verifyPassword } from "@/lib/auth";
import { okResponse, errResponse } from "@/server/core/result";
import { recordAuditLog } from "@/server/core/audit";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { login, password } = body;

    if (!login || !password) {
      return NextResponse.json(errResponse("E-mail/usuário e senha são obrigatórios."), { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: login.trim() }, { username: login.trim() }],
      },
      include: {
        wallet: true,
        compliance: true,
      },
    });

    if (!user) {
      return NextResponse.json(errResponse("Credenciais inválidas."), { status: 401 });
    }

    if (user.isSuspended) {
      return NextResponse.json(
        errResponse(`Conta suspensa por moderação: ${user.suspensionReason || "Acesso restrito."}`),
        { status: 403 }
      );
    }

    if (user.compliance?.isSelfExcluded) {
      if (user.compliance.selfExcludedUntil && new Date() < user.compliance.selfExcludedUntil) {
        return NextResponse.json(
          errResponse(
            `Conta em período de autoexclusão voluntária até ${user.compliance.selfExcludedUntil.toLocaleDateString()}.`
          ),
          { status: 403 }
        );
      }
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(errResponse("Credenciais inválidas."), { status: 401 });
    }

    const token = await createToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    });

    await recordAuditLog({
      actorId: user.id,
      actorRole: user.role,
      action: "USER_LOGGED_IN",
      entity: "USER",
      entityId: user.id,
    });

    const response = NextResponse.json(
      okResponse({
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          wallet: user.wallet,
        },
        token,
      })
    );

    response.cookies.set("apex_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(errResponse(error.message || "Erro interno ao autenticar."), { status: 500 });
  }
}
