import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { WalletService } from "@/server/modules/wallet/wallet.service";
import { PlinkoEngine, PlinkoRisk } from "@/server/modules/casino/games/plinko.engine";
import { prisma } from "@/lib/db";
import { okResponse, errResponse } from "@/server/core/result";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(errResponse("Não autenticado", "UNAUTHORIZED"), { status: 401 });
    }

    const body = await req.json();
    const { betAmount, rows = 12, risk = "MEDIUM" } = body;

    const amount = Number(betAmount);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(errResponse("Valor de aposta inválido."), { status: 400 });
    }

    const validRisk: PlinkoRisk = ["LOW", "MEDIUM", "HIGH"].includes(risk) ? risk : "MEDIUM";
    const validRows = parseInt(rows, 10);

    // Debit virtual balance
    await WalletService.debitVirtualBalance(
      session.userId,
      amount,
      "CASINO_BET",
      undefined,
      `Aposta no Apex Plinko (${validRows} linhas, risco ${validRisk})`
    );

    const drop = PlinkoEngine.dropBall(validRows, validRisk);
    const payout = Number((amount * drop.multiplier).toFixed(2));

    if (payout > 0) {
      await WalletService.creditVirtualBalance(
        session.userId,
        payout,
        "CASINO_WIN",
        undefined,
        `Retorno Apex Plinko (${drop.multiplier}x)`
      );
    }

    await prisma.demoGameRound.create({
      data: {
        userId: session.userId,
        gameType: "PLINKO",
        betAmount: amount,
        multiplier: drop.multiplier,
        payout,
        resultDetailsJson: JSON.stringify({
          rows: validRows,
          risk: validRisk,
          slotIndex: drop.slotIndex,
          path: drop.path,
        }),
        serverSeed: drop.serverSeed,
      },
    });

    return NextResponse.json(
      okResponse({
        path: drop.path,
        slotIndex: drop.slotIndex,
        multiplier: drop.multiplier,
        payout,
        multiplierTable: PlinkoEngine.getMultiplierTable(validRows, validRisk),
      })
    );
  } catch (error: any) {
    return NextResponse.json(errResponse(error.message), { status: 500 });
  }
}
