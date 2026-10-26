import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { okResponse, errResponse } from "@/server/core/result";
import { ApiSportsAdapter } from "@/server/modules/sports/api-sports.adapter";

export async function GET() {
  try {
    await requireAdminUser();
    const adapter = new ApiSportsAdapter();
    const key = await adapter.getApiKey();

    if (!key) {
      return NextResponse.json(
        okResponse({
          configured: false,
          maskedKey: null,
          signupUrl: "https://dashboard.api-sports.io/",
          instructions: "Cadastre-se gratuitamente em https://dashboard.api-sports.io/ para obter sua chave de 100 requisições/dia.",
        })
      );
    }

    const maskedKey = `${key.slice(0, 4)}...${key.slice(-4)}`;
    const health = await adapter.getHealth();

    return NextResponse.json(
      okResponse({
        configured: true,
        maskedKey,
        health,
        signupUrl: "https://dashboard.api-sports.io/",
      })
    );
  } catch (error: any) {
    return NextResponse.json(errResponse(error.message), {
      status: error.message.includes("Não autorizado") ? 401 : 500,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdminUser();
    const body = await req.json();
    const { key } = body;

    if (!key || typeof key !== "string" || key.trim().length === 0) {
      return NextResponse.json(errResponse("Por favor, forneça uma chave válida do API-SPORTS."), { status: 400 });
    }

    const adapter = new ApiSportsAdapter();
    await adapter.setApiKey(key.trim());

    return NextResponse.json(
      okResponse({
        message: "Chave do API-SPORTS validada e configurada com sucesso com criptografia e armazenamento seguro.",
        configured: true,
        maskedKey: `${key.trim().slice(0, 4)}...${key.trim().slice(-4)}`,
      })
    );
  } catch (error: any) {
    return NextResponse.json(errResponse(error.message || "Erro ao validar chave."), {
      status: error.message.includes("Não autorizado") ? 401 : 400,
    });
  }
}
