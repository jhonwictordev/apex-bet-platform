import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { GameIntegrationGateway } from "@/server/modules/providers/gateway";
import { okResponse, errResponse } from "@/server/core/result";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(errResponse("Não autenticado", "UNAUTHORIZED"), { status: 401 });
    }

    const body = await req.json();
    const { slug } = body;

    if (!slug) {
      return NextResponse.json(errResponse("Identificador do jogo é obrigatório."), { status: 400 });
    }

    const launch = await GameIntegrationGateway.launchDemoSession({
      gameId: slug,
      slug,
      userId: session.userId,
      username: session.username,
      currency: "BRL",
    });

    return NextResponse.json(okResponse(launch));
  } catch (error: any) {
    return NextResponse.json(errResponse(error.message), { status: 500 });
  }
}
