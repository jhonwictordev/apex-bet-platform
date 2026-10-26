import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { SportsBetEngine } from "@/server/modules/sports/bet-engine.service";
import { okResponse, errResponse } from "@/server/core/result";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(errResponse("Não autenticado", "UNAUTHORIZED"), { status: 401 });
    }

    const body = await req.json();
    const { betId } = body;

    if (!betId) {
      return NextResponse.json(errResponse("Identificador da aposta obrigatório."), { status: 400 });
    }

    const result = await SportsBetEngine.cashout(betId, session.userId);
    return NextResponse.json(
      okResponse(result, `Encerramento antecipado confirmado! R$ ${result.cashoutAmount.toFixed(2)} creditados.`)
    );
  } catch (error: any) {
    return NextResponse.json(errResponse(error.message), { status: 400 });
  }
}
