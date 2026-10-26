import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { SportsBetEngine } from "@/server/modules/sports/bet-engine.service";
import { PlaceBetRequest } from "@/server/modules/sports/types";
import { okResponse, errResponse } from "@/server/core/result";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(errResponse("Não autenticado", "UNAUTHORIZED"), { status: 401 });
    }

    const body = (await req.json()) as PlaceBetRequest;
    const { type, stake, selections } = body;

    const bet = await SportsBetEngine.placeBet({
      userId: session.userId,
      type,
      stake,
      selections,
    });

    return NextResponse.json(
      okResponse(bet, "Aposta esportiva virtual registrada com sucesso no cupom!")
    );
  } catch (error: any) {
    return NextResponse.json(errResponse(error.message), { status: 400 });
  }
}
