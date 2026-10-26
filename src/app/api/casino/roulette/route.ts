import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { WalletService } from "@/server/modules/wallet/wallet.service";
import { RouletteBetPlacement, RouletteEngine } from "@/server/modules/casino/games/roulette.engine";
import { prisma } from "@/lib/db";
import { okResponse, errResponse } from "@/server/core/result";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(errResponse("Não autenticado", "UNAUTHORIZED"), { status: 401 });
    }

    const body = await req.json();
    const { bets } = body as { bets: RouletteBetPlacement[] };

    if (!Array.isArray(bets) || bets.length === 0) {
      return NextResponse.json(errResponse("Insira ao menos uma aposta na mesa de roleta."), { status: 400 });
    }

    let totalStake = 0;
    for (const b of bets) {
      if (b.amount <= 0) {
        return NextResponse.json(errResponse("O valor da ficha deve ser maior que zero."), { status: 400 });
      }
      totalStake += b.amount;
    }

    // Debit virtual balance
    await WalletService.debitVirtualBalance(
      session.userId,
      totalStake,
      "CASINO_BET",
      undefined,
      `Aposta na Roleta Royale (${bets.length} seleções)`
    );

    const spin = RouletteEngine.spin(bets);

    if (spin.totalPayout > 0) {
      await WalletService.creditVirtualBalance(
        session.userId,
        spin.totalPayout,
        "CASINO_WIN",
        undefined,
        `Ganho na Roleta Royale (Número sorteado: ${spin.winningNumber} ${spin.color})`
      );
    }

    await prisma.demoGameRound.create({
      data: {
        userId: session.userId,
        gameType: "ROULETTE",
        betAmount: totalStake,
        multiplier: spin.multiplier,
        payout: spin.totalPayout,
        resultDetailsJson: JSON.stringify({
          winningNumber: spin.winningNumber,
          color: spin.color,
          bets,
        }),
        serverSeed: spin.serverSeed,
      },
    });

    return NextResponse.json(
      okResponse({
        winningNumber: spin.winningNumber,
        color: spin.color,
        totalStake: spin.totalStake,
        totalPayout: spin.totalPayout,
        multiplier: spin.multiplier,
        isWon: spin.totalPayout > 0,
      })
    );
  } catch (error: any) {
    return NextResponse.json(errResponse(error.message), { status: 500 });
  }
}
