import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { WalletService } from "@/server/modules/wallet/wallet.service";
import { okResponse, errResponse } from "@/server/core/result";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(errResponse("Não autenticado", "UNAUTHORIZED"), { status: 401 });
    }

    const wallet = await WalletService.getOrCreateWallet(session.userId);
    return NextResponse.json(okResponse(wallet));
  } catch (error: any) {
    return NextResponse.json(errResponse(error.message), { status: 500 });
  }
}
