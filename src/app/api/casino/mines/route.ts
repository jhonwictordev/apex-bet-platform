import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { WalletService } from "@/server/modules/wallet/wallet.service";
import { MinesEngine, MinesState } from "@/server/modules/casino/games/mines.engine";
import { prisma } from "@/lib/db";
import { okResponse, errResponse } from "@/server/core/result";

const activeMinesGames = new Map<string, {
  userId: string;
  betAmount: number;
  state: MinesState;
}>();

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(errResponse("Não autenticado", "UNAUTHORIZED"), { status: 401 });
    }

    const body = await req.json();
    const { action, betAmount, minesCount, tileIndex, gameId } = body;

    if (action === "START") {
      const amount = Number(betAmount);
      const mines = parseInt(minesCount, 10);

      if (isNaN(amount) || amount <= 0) {
        return NextResponse.json(errResponse("Valor de aposta inválido."), { status: 400 });
      }

      if (isNaN(mines) || mines < 1 || mines > 24) {
        return NextResponse.json(errResponse("Quantidade de minas deve ser entre 1 e 24."), { status: 400 });
      }

      await WalletService.debitVirtualBalance(
        session.userId,
        amount,
        "CASINO_BET",
        undefined,
        `Aposta no jogo Apex Mines (${mines} minas)`
      );

      const { minePositions, serverSeed } = MinesEngine.generateMinePositions(mines);
      const id = `mines_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const state: MinesState = {
        minesCount: mines,
        minePositions,
        revealedPositions: [],
        isExploded: false,
        isCashedOut: false,
        currentMultiplier: 1.0,
        serverSeed,
      };

      activeMinesGames.set(id, {
        userId: session.userId,
        betAmount: amount,
        state,
      });

      return NextResponse.json(
        okResponse({
          gameId: id,
          minesCount: mines,
          currentMultiplier: 1.0,
          revealedPositions: [],
          nextMultiplier: MinesEngine.calculateMultiplier(mines, 1),
        })
      );
    }

    if (action === "PICK") {
      if (!gameId || !activeMinesGames.has(gameId)) {
        return NextResponse.json(errResponse("Jogo de Mines não encontrado ou finalizado."), { status: 404 });
      }

      const active = activeMinesGames.get(gameId)!;
      if (active.userId !== session.userId) {
        return NextResponse.json(errResponse("Acesso não autorizado."), { status: 403 });
      }

      if (active.state.isExploded || active.state.isCashedOut) {
        return NextResponse.json(errResponse("Este jogo já terminou."), { status: 400 });
      }

      const tile = parseInt(tileIndex, 10);
      const result = MinesEngine.pickTile(active.state, tile);

      if (result.isMine) {
        // Mine exploded!
        active.state.isExploded = true;
        const allMines = active.state.minePositions;
        activeMinesGames.delete(gameId);

        await prisma.demoGameRound.create({
          data: {
            userId: session.userId,
            gameType: "MINES",
            betAmount: active.betAmount,
            multiplier: 0.0,
            payout: 0.0,
            resultDetailsJson: JSON.stringify({
              revealedCount: active.state.revealedPositions.length,
              explodedAt: tile,
              allMines,
            }),
            serverSeed: active.state.serverSeed,
          },
        });

        return NextResponse.json(
          okResponse({
            isMine: true,
            isExploded: true,
            currentMultiplier: 0.0,
            allMines,
            message: "BOOM! Você acertou uma mina e a aposta foi perdida.",
          })
        );
      }

      // Safe gem revealed!
      active.state.revealedPositions.push(tile);
      active.state.currentMultiplier = result.nextMultiplier;

      const safeTilesRemaining = 25 - active.state.minesCount - active.state.revealedPositions.length;
      const nextMultiplier =
        safeTilesRemaining > 0
          ? MinesEngine.calculateMultiplier(active.state.minesCount, active.state.revealedPositions.length + 1)
          : result.nextMultiplier;

      return NextResponse.json(
        okResponse({
          isMine: false,
          revealedPositions: active.state.revealedPositions,
          currentMultiplier: result.nextMultiplier,
          currentPayout: Number((active.betAmount * result.nextMultiplier).toFixed(2)),
          nextMultiplier,
          safeTilesRemaining,
        })
      );
    }

    if (action === "CASHOUT") {
      if (!gameId || !activeMinesGames.has(gameId)) {
        return NextResponse.json(errResponse("Jogo de Mines não encontrado."), { status: 404 });
      }

      const active = activeMinesGames.get(gameId)!;
      if (active.userId !== session.userId) {
        return NextResponse.json(errResponse("Acesso não autorizado."), { status: 403 });
      }

      if (active.state.revealedPositions.length === 0) {
        return NextResponse.json(errResponse("Revele ao menos um diamante antes do cashout."), { status: 400 });
      }

      const mult = active.state.currentMultiplier;
      const payout = Number((active.betAmount * mult).toFixed(2));
      const allMines = active.state.minePositions;

      active.state.isCashedOut = true;
      activeMinesGames.delete(gameId);

      await WalletService.creditVirtualBalance(
        session.userId,
        payout,
        "CASINO_WIN",
        gameId,
        `Ganho no Apex Mines (${mult.toFixed(2)}x)`
      );

      await prisma.demoGameRound.create({
        data: {
          userId: session.userId,
          gameType: "MINES",
          betAmount: active.betAmount,
          multiplier: mult,
          payout,
          resultDetailsJson: JSON.stringify({
            revealedPositions: active.state.revealedPositions,
            allMines,
          }),
          serverSeed: active.state.serverSeed,
        },
      });

      return NextResponse.json(
        okResponse({
          isCashedOut: true,
          multiplier: mult,
          payout,
          allMines,
          message: `Cashout concluído com sucesso! Prêmio: R$ ${payout.toFixed(2)} (${mult.toFixed(2)}x)`,
        })
      );
    }

    return NextResponse.json(errResponse("Ação inválida."), { status: 400 });
  } catch (error: any) {
    return NextResponse.json(errResponse(error.message), { status: 500 });
  }
}
