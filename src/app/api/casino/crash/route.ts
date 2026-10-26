import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { WalletService } from "@/server/modules/wallet/wallet.service";
import { CrashEngine } from "@/server/modules/casino/games/crash.engine";
import { prisma } from "@/lib/db";
import { okResponse, errResponse } from "@/server/core/result";

// In-memory active crash rounds (in production this would be Redis)
const activeCrashRounds = new Map<string, {
  userId: string;
  betAmount: number;
  crashPoint: number;
  serverSeed: string;
  isCashedOut: boolean;
  createdAt: number;
}>();

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(errResponse("Não autenticado", "UNAUTHORIZED"), { status: 401 });
    }

    const body = await req.json();
    const { action, betAmount, cashoutMultiplier, roundId } = body;

    if (action === "BET") {
      const amount = Number(betAmount);
      if (isNaN(amount) || amount <= 0) {
        return NextResponse.json(errResponse("Valor de aposta inválido."), { status: 400 });
      }

      // Debit virtual balance
      await WalletService.debitVirtualBalance(
        session.userId,
        amount,
        "CASINO_BET",
        undefined,
        "Aposta no jogo Apex Crash"
      );

      const generated = CrashEngine.generateCrashPoint();
      const id = `crash_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      activeCrashRounds.set(id, {
        userId: session.userId,
        betAmount: amount,
        crashPoint: generated.crashPoint,
        serverSeed: generated.serverSeed,
        isCashedOut: false,
        createdAt: Date.now(),
      });

      return NextResponse.json(
        okResponse({
          roundId: id,
          betAmount: amount,
          // We return crashPoint for real-time frontend animation synchrony
          crashPoint: generated.crashPoint,
        })
      );
    }

    if (action === "CASHOUT") {
      if (!roundId || !activeCrashRounds.has(roundId)) {
        return NextResponse.json(errResponse("Rodada não encontrada ou expirada."), { status: 404 });
      }

      const active = activeCrashRounds.get(roundId)!;
      if (active.userId !== session.userId) {
        return NextResponse.json(errResponse("Acesso não autorizado à rodada."), { status: 403 });
      }

      if (active.isCashedOut) {
        return NextResponse.json(errResponse("Esta rodada já foi encerrada."), { status: 400 });
      }

      const mult = Number(cashoutMultiplier);
      if (isNaN(mult) || mult < 1.0) {
        return NextResponse.json(errResponse("Multiplicador de cashout inválido."), { status: 400 });
      }

      const isValid = CrashEngine.validateCashout(mult, active.crashPoint);
      if (!isValid) {
        // Crashed before cashout!
        active.isCashedOut = true;
        activeCrashRounds.delete(roundId);

        // Record loss in DB
        await prisma.demoGameRound.create({
          data: {
            userId: session.userId,
            gameType: "CRASH",
            betAmount: active.betAmount,
            multiplier: 0.0,
            payout: 0.0,
            resultDetailsJson: JSON.stringify({
              crashedAt: active.crashPoint,
              attemptedCashout: mult,
            }),
            serverSeed: active.serverSeed,
          },
        });

        return NextResponse.json(
          okResponse({
            isWon: false,
            payout: 0.0,
            multiplier: 0.0,
            crashPoint: active.crashPoint,
            message: `O foguete explodiu em ${active.crashPoint.toFixed(2)}x antes do seu cashout!`,
          })
        );
      }

      // Valid cashout!
      active.isCashedOut = true;
      const payout = Number((active.betAmount * mult).toFixed(2));
      activeCrashRounds.delete(roundId);

      await WalletService.creditVirtualBalance(
        session.userId,
        payout,
        "CASINO_WIN",
        roundId,
        `Ganho no Apex Crash (${mult.toFixed(2)}x)`
      );

      // Record in DB
      await prisma.demoGameRound.create({
        data: {
          userId: session.userId,
          gameType: "CRASH",
          betAmount: active.betAmount,
          multiplier: mult,
          payout,
          resultDetailsJson: JSON.stringify({
            crashedAt: active.crashPoint,
            cashedOutAt: mult,
          }),
          serverSeed: active.serverSeed,
        },
      });

      return NextResponse.json(
        okResponse({
          isWon: true,
          payout,
          multiplier: mult,
          crashPoint: active.crashPoint,
          message: `Cashout realizado com sucesso! Ganho de R$ ${payout.toFixed(2)} (${mult.toFixed(2)}x)`,
        })
      );
    }

    return NextResponse.json(errResponse("Ação não reconhecida."), { status: 400 });
  } catch (error: any) {
    return NextResponse.json(errResponse(error.message), { status: 500 });
  }
}
