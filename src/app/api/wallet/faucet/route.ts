import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { WalletService } from "@/server/modules/wallet/wallet.service";
import { okResponse, errResponse } from "@/server/core/result";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(errResponse("Não autenticado", "UNAUTHORIZED"), { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const targetAmount = body.targetAmount || 10000.0;

    const result = await WalletService.refillFaucet(session.userId, targetAmount);
    return NextResponse.json(
      okResponse(
        result,
        `Saldo de demonstração recarregado com sucesso para R$ ${result.wallet.demoBalance.toFixed(2)}.`
      )
    );
  } catch (error: any) {
    return NextResponse.json(errResponse(error.message), { status: 400 });
  }
}
