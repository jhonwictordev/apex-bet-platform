import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createToken, hashPassword } from "@/lib/auth";
import { okResponse, errResponse } from "@/server/core/result";
import { recordAuditLog } from "@/server/core/audit";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, username, password, birthDate } = body;

    if (!email || !username || !password) {
      return NextResponse.json(errResponse("Todos os campos obrigatórios devem ser preenchidos."), { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json(errResponse("A senha deve ter no mínimo 6 caracteres."), { status: 400 });
    }

    // Verify age (18+)
    if (birthDate) {
      const birth = new Date(birthDate);
      const ageDifMs = Date.now() - birth.getTime();
      const ageDate = new Date(ageDifMs);
      const age = Math.abs(ageDate.getUTCFullYear() - 1970);
      if (age < 18) {
        return NextResponse.json(
          errResponse("Apenas maiores de 18 anos podem se cadastrar na plataforma."),
          { status: 403 }
        );
      }
    }

    // Check unique email / username
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existing) {
      return NextResponse.json(
        errResponse("Já existe uma conta cadastrada com este e-mail ou nome de usuário."),
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        role: "USER",
        birthDate: birthDate ? new Date(birthDate) : null,
        wallet: {
          create: {
            demoBalance: 10000.0,
            currency: "BRL",
            totalDepositedVirtual: 10000.0,
          },
        },
        compliance: {
          create: {
            sessionTimeLimitMinutes: 120,
          },
        },
      },
      include: {
        wallet: true,
      },
    });

    // Create session token
    const token = await createToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    });

    await recordAuditLog({
      actorId: user.id,
      actorRole: user.role,
      action: "USER_REGISTERED",
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
    return NextResponse.json(errResponse(error.message || "Erro interno ao cadastrar."), { status: 500 });
  }
}
