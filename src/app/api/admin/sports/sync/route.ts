import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth";
import { okResponse, errResponse } from "@/server/core/result";
import { SportsSyncWorker } from "@/server/modules/sports/sports-sync.worker";

export async function POST(req: NextRequest) {
  try {
    await requireAdminUser();
    const worker = SportsSyncWorker.getInstance();
    const stats = await worker.syncAll();

    return NextResponse.json(
      okResponse({
        message: "Sincronização de dados esportivos concluída com sucesso.",
        stats,
      })
    );
  } catch (error: any) {
    return NextResponse.json(errResponse(error.message), {
      status: error.message.includes("Não autorizado") ? 401 : 500,
    });
  }
}
