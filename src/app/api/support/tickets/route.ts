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

    const isSupport = session.role === "SUPPORT" || session.role === "ADMIN" || session.role === "SUPER_ADMIN";

    const tickets = await prisma.supportTicket.findMany({
      where: isSupport ? {} : { userId: session.userId },
      include: {
        user: { select: { username: true, email: true } },
        messages: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(okResponse(tickets));
  } catch (error: any) {
    return NextResponse.json(errResponse(error.message), { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(errResponse("Não autenticado", "UNAUTHORIZED"), { status: 401 });
    }

    const body = await req.json();
    const { subject, category, message, priority = "NORMAL" } = body;

    if (!subject || !category || !message) {
      return NextResponse.json(errResponse("Assunto, categoria e mensagem são obrigatórios."), { status: 400 });
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: session.userId,
        subject,
        category,
        priority,
        status: "OPEN",
        messages: {
          create: {
            senderId: session.userId,
            senderRole: session.role,
            message,
          },
        },
      },
      include: {
        messages: true,
      },
    });

    return NextResponse.json(okResponse(ticket, "Chamado de suporte aberto com sucesso!"));
  } catch (error: any) {
    return NextResponse.json(errResponse(error.message), { status: 500 });
  }
}
