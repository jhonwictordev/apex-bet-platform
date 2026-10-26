import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { GameIntegrationGateway } from "@/server/modules/providers/gateway";
import { ProviderCode } from "@/server/modules/providers/types";
import { okResponse, errResponse } from "@/server/core/result";

export async function POST(req: NextRequest) {
  try {
    await requireAdminUser();
    const body = await req.json();
    const { providerCode } = body as { providerCode: ProviderCode };

    if (!providerCode) {
      return NextResponse.json(errResponse("Código do provedor obrigatório."), { status: 400 });
    }

    const result = await GameIntegrationGateway.syncCatalog(providerCode);
    return NextResponse.json(okResponse(result, "Catálogo sincronizado com sucesso no banco de dados local."));
  } catch (error: any) {
    const status = error.message.includes("FORBIDDEN") ? 403 : 500;
    return NextResponse.json(errResponse(error.message), { status });
  }
}
