import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { WalletService } from "@/server/modules/wallet/wallet.service";
import { DiceCondition, DiceEngine } from "@/server/modules/casino/games/dice.engine";
import { prisma } from "@/lib/db";
import { okResponse, errResponse } from "@/server/core/result";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(errResponse("Não autenticado", "UNAUTHORIZED"), { status: 401 });
    }

    const body = await req.json();
    const { betAmount, target = 50.0, condition = "ROLL_OVER" } = body;

    const amount = Number(betAmount);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(errResponse("Valor de aposta inválido."), { status: 400 });
    }

    const validCondition: DiceCondition = condition === "ROLL_UNDER" ? "ROLL_UNDER" : "ROLL_OVER";
    const validTarget = Number(target);

    // Debit virtual balance
    await WalletService.debitVirtualBalance(
      session.userId,
      amount,
      "CASINO_BET",
      undefined,
      `Aposta no Apex Dice (${validCondition} ${validTarget})`
    );

    const roll = DiceEngine.roll(amount, validTarget, validCondition);

    if (roll.isWon && roll.payout > 0) {
      await WalletService.creditVirtualBalance(
        session.userId,
        roll.payout,
        "CASINO_WIN",
        undefined,
        `Ganho no Apex Dice (${roll.multiplier}x)`
      );
    }

    await prisma.demoGameRound.create({
      data: {
        userId: session.userId,
        gameType: "DICE",
        betAmount: amount,
        multiplier: roll.isWon ? roll.multiplier : 0.0,
        payout: roll.payout,
        resultDetailsJson: JSON.stringify({
          rollValue: roll.rollValue,
          condition: roll.condition,
          target: roll.target,
          winChance: roll.winChance,
        }),
        serverSeed: roll.serverSeed,
      },
    });

    return NextResponse.json(okResponse(roll));
  } catch (error: any) {
    return NextResponse.json(errResponse(error.message), { status: 500 });
  }
}
