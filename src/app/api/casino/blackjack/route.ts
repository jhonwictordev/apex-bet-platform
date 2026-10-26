import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { WalletService } from "@/server/modules/wallet/wallet.service";
import { BlackjackEngine, BlackjackGameState } from "@/server/modules/casino/games/blackjack.engine";
import { prisma } from "@/lib/db";
import { okResponse, errResponse } from "@/server/core/result";

const activeBlackjackGames = new Map<string, {
  userId: string;
  state: BlackjackGameState;
}>();

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(errResponse("Não autenticado", "UNAUTHORIZED"), { status: 401 });
    }

    const body = await req.json();
    const { action, betAmount, gameId } = body;

    if (action === "DEAL") {
      const amount = Number(betAmount);
      if (isNaN(amount) || amount <= 0) {
        return NextResponse.json(errResponse("Valor de aposta inválido."), { status: 400 });
      }

      await WalletService.debitVirtualBalance(
        session.userId,
        amount,
        "CASINO_BET",
        undefined,
        "Aposta no Blackjack VIP Pro"
      );

      const state = BlackjackEngine.dealInitial(amount);

      // If finished immediately (Blackjack or Push)
      if (state.status !== "IN_PROGRESS") {
        if (state.payout > 0) {
          await WalletService.creditVirtualBalance(
            session.userId,
            state.payout,
            "CASINO_WIN",
            state.id,
            `Blackjack VIP Pro (${state.status})`
          );
        }

        await prisma.demoGameRound.create({
          data: {
            userId: session.userId,
            gameType: "BLACKJACK",
            betAmount: amount,
            multiplier: state.multiplier,
            payout: state.payout,
            resultDetailsJson: JSON.stringify({
              status: state.status,
              playerCards: state.playerCards,
              dealerCards: state.dealerCards,
              playerScore: state.playerScore,
              dealerScore: state.dealerScore,
            }),
            serverSeed: "provably-fair-deck",
          },
        });

        return NextResponse.json(okResponse({ state }));
      }

      activeBlackjackGames.set(state.id, {
        userId: session.userId,
        state,
      });

      // Mask dealer's second card for in-progress game
      const maskedState = {
        ...state,
        dealerCards: [state.dealerCards[0], { suit: "?", rank: "?", value: 0 }],
        deck: [], // Do not send deck to client
      };

      return NextResponse.json(okResponse({ state: maskedState }));
    }

    if (action === "HIT") {
      if (!gameId || !activeBlackjackGames.has(gameId)) {
        return NextResponse.json(errResponse("Mesa não encontrada ou encerrada."), { status: 404 });
      }

      const active = activeBlackjackGames.get(gameId)!;
      if (active.userId !== session.userId) {
        return NextResponse.json(errResponse("Acesso não autorizado."), { status: 403 });
      }

      const newState = BlackjackEngine.hit(active.state);
      active.state = newState;

      if (newState.status === "PLAYER_BUST") {
        activeBlackjackGames.delete(gameId);

        await prisma.demoGameRound.create({
          data: {
            userId: session.userId,
            gameType: "BLACKJACK",
            betAmount: newState.betAmount,
            multiplier: 0.0,
            payout: 0.0,
            resultDetailsJson: JSON.stringify({
              status: "PLAYER_BUST",
              playerCards: newState.playerCards,
              dealerCards: newState.dealerCards,
              playerScore: newState.playerScore,
              dealerScore: newState.dealerScore,
            }),
            serverSeed: "provably-fair-deck",
          },
        });

        return NextResponse.json(okResponse({ state: { ...newState, deck: [] } }));
      }

      // Mask dealer card
      const maskedState = {
        ...newState,
        dealerCards: [newState.dealerCards[0], { suit: "?", rank: "?", value: 0 }],
        deck: [],
      };

      return NextResponse.json(okResponse({ state: maskedState }));
    }

    if (action === "STAND") {
      if (!gameId || !activeBlackjackGames.has(gameId)) {
        return NextResponse.json(errResponse("Mesa não encontrada."), { status: 404 });
      }

      const active = activeBlackjackGames.get(gameId)!;
      if (active.userId !== session.userId) {
        return NextResponse.json(errResponse("Acesso não autorizado."), { status: 403 });
      }

      const resolved = BlackjackEngine.stand(active.state);
      activeBlackjackGames.delete(gameId);

      if (resolved.payout > 0) {
        await WalletService.creditVirtualBalance(
          session.userId,
          resolved.payout,
          "CASINO_WIN",
          resolved.id,
          `Ganho no Blackjack VIP Pro (${resolved.status})`
        );
      }

      await prisma.demoGameRound.create({
        data: {
          userId: session.userId,
          gameType: "BLACKJACK",
          betAmount: resolved.betAmount,
          multiplier: resolved.multiplier,
          payout: resolved.payout,
          resultDetailsJson: JSON.stringify({
            status: resolved.status,
            playerCards: resolved.playerCards,
            dealerCards: resolved.dealerCards,
            playerScore: resolved.playerScore,
            dealerScore: resolved.dealerScore,
          }),
          serverSeed: "provably-fair-deck",
        },
      });

      return NextResponse.json(okResponse({ state: { ...resolved, deck: [] } }));
    }

    return NextResponse.json(errResponse("Ação inválida."), { status: 400 });
  } catch (error: any) {
    return NextResponse.json(errResponse(error.message), { status: 500 });
  }
}
