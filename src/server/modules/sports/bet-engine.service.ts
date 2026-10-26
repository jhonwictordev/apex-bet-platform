import { prisma } from "@/lib/db";
import { WalletService } from "@/server/modules/wallet/wallet.service";
import { BetSelectionInput, PlaceBetRequest } from "./types";
import { recordAuditLog } from "@/server/core/audit";

export class SportsBetEngine {
  /**
   * Places a virtual sports bet (Single or Multiple / Parlay).
   */
  static async placeBet(request: PlaceBetRequest) {
    const { userId, type, stake, selections } = request;

    if (!selections || selections.length === 0) {
      throw new Error("O cupom de aposta deve conter pelo menos uma seleção.");
    }

    if (type === "MULTIPLE" && selections.length < 2) {
      throw new Error("Apostas múltiplas exigem ao menos duas seleções de eventos distintos.");
    }

    if (stake <= 0) {
      throw new Error("O valor da aposta virtual deve ser maior que zero.");
    }

    // Verify selections and calculate total odds
    let totalOdds = 1.0;
    const validatedSelections: BetSelectionInput[] = [];

    for (const sel of selections) {
      const odd = await prisma.odd.findUnique({
        where: { id: sel.oddId },
        include: {
          market: {
            include: {
              event: true,
            },
          },
        },
      });

      if (!odd || !odd.isActive) {
        throw new Error(`A cotação selecionada (${sel.selectionLabel}) não está mais disponível.`);
      }

      if (odd.market.status !== "ACTIVE" || odd.market.event.status === "FINISHED") {
        throw new Error(`O mercado ou evento para ${sel.eventName} está encerrado ou suspenso.`);
      }

      totalOdds *= odd.value;
      validatedSelections.push({
        eventId: odd.market.eventId,
        marketId: odd.marketId,
        oddId: odd.id,
        eventName: `${odd.market.event.homeTeam} x ${odd.market.event.awayTeam}`,
        marketName: odd.market.name,
        selectionLabel: odd.label,
        oddValue: odd.value,
      });
    }

    totalOdds = Number(totalOdds.toFixed(2));
    const potentialReturn = Number((stake * totalOdds).toFixed(2));

    // Debit virtual balance atomically
    await WalletService.debitVirtualBalance(
      userId,
      stake,
      "SPORTS_BET",
      undefined,
      `Aposta Esportiva Virtual (${type === "MULTIPLE" ? "Múltipla" : "Simples"} - Odd ${totalOdds})`
    );

    // Create Bet record with selections
    const bet = await prisma.bet.create({
      data: {
        userId,
        type,
        totalStake: stake,
        totalOdds,
        potentialReturn,
        status: "PENDING",
        selections: {
          create: validatedSelections.map((s) => ({
            eventId: s.eventId,
            marketId: s.marketId,
            oddId: s.oddId,
            eventName: s.eventName,
            marketName: s.marketName,
            selectionLabel: s.selectionLabel,
            oddValue: s.oddValue,
            status: "PENDING",
          })),
        },
      },
      include: {
        selections: true,
      },
    });

    await recordAuditLog({
      actorId: userId,
      action: "SPORTS_BET_PLACED",
      entity: "BET",
      entityId: bet.id,
      details: {
        stake,
        totalOdds,
        potentialReturn,
        selectionsCount: validatedSelections.length,
      },
    });

    return bet;
  }

  /**
   * Settles an event with winning odds, and settles all bets placed on that event.
   */
  static async settleEvent(eventId: string, winningOddIds: string[]) {
    // 1. Mark winning odds in market
    await prisma.odd.updateMany({
      where: { market: { eventId } },
      data: { isWinning: false },
    });

    if (winningOddIds.length > 0) {
      await prisma.odd.updateMany({
        where: { id: { in: winningOddIds } },
        data: { isWinning: true },
      });
    }

    // 2. Mark selections on this event
    const eventSelections = await prisma.betSelection.findMany({
      where: { eventId, status: "PENDING" },
      include: { bet: true },
    });

    for (const sel of eventSelections) {
      const isWinner = winningOddIds.includes(sel.oddId);
      await prisma.betSelection.update({
        where: { id: sel.id },
        data: { status: isWinner ? "WON" : "LOST" },
      });
    }

    // 3. Evaluate bets affected
    const affectedBetIds = Array.from(new Set(eventSelections.map((s) => s.betId)));

    for (const betId of affectedBetIds) {
      await this.evaluateAndSettleBet(betId);
    }
  }

  /**
   * Evaluates if a bet is completely settled (WON, LOST, or still PENDING).
   */
  private static async evaluateAndSettleBet(betId: string) {
    const bet = await prisma.bet.findUnique({
      where: { id: betId },
      include: { selections: true },
    });

    if (!bet || bet.status !== "PENDING") return;

    const anyLost = bet.selections.some((s) => s.status === "LOST");
    const allWon = bet.selections.every((s) => s.status === "WON");
    const anyPending = bet.selections.some((s) => s.status === "PENDING");

    if (anyLost) {
      // Bet is LOST
      await prisma.bet.update({
        where: { id: bet.id },
        data: {
          status: "LOST",
          actualReturn: 0.0,
          settledAt: new Date(),
        },
      });
    } else if (allWon && !anyPending) {
      // Bet is WON! Credit virtual winnings to wallet
      await prisma.bet.update({
        where: { id: bet.id },
        data: {
          status: "WON",
          actualReturn: bet.potentialReturn,
          settledAt: new Date(),
        },
      });

      await WalletService.creditVirtualBalance(
        bet.userId,
        bet.potentialReturn,
        "SPORTS_WIN",
        bet.id,
        `Retorno de Aposta Esportiva (${bet.type === "MULTIPLE" ? "Múltipla" : "Simples"} - Odd ${bet.totalOdds})`
      );

      // Create notification
      await prisma.notification.create({
        data: {
          userId: bet.userId,
          title: "Aposta Vencedora! 🎉",
          message: `Sua aposta esportiva de R$ ${bet.totalStake.toFixed(2)} foi vitoriosa! Retorno creditado: R$ ${bet.potentialReturn.toFixed(2)}.`,
          type: "BET_RESULT",
        },
      });
    }
  }

  /**
   * Cashout a pending bet early with a calculated fair virtual cashout offer.
   */
  static async cashout(betId: string, userId: string) {
    const bet = await prisma.bet.findUnique({
      where: { id: betId },
      include: { selections: true },
    });

    if (!bet || bet.userId !== userId) {
      throw new Error("Aposta não encontrada.");
    }

    if (bet.status !== "PENDING") {
      throw new Error("Esta aposta não pode ser encerrada (já finalizada).");
    }

    // Cashout formula: 85% of stake if no selections resolved, or scaled by progress
    const wonCount = bet.selections.filter((s) => s.status === "WON").length;
    const cashoutMultiplier = 0.85 + (wonCount / bet.selections.length) * 0.5;
    const cashoutAmount = Number((bet.totalStake * cashoutMultiplier).toFixed(2));

    await prisma.bet.update({
      where: { id: bet.id },
      data: {
        status: "CASHED_OUT",
        actualReturn: cashoutAmount,
        settledAt: new Date(),
      },
    });

    await WalletService.creditVirtualBalance(
      userId,
      cashoutAmount,
      "SPORTS_WIN",
      bet.id,
      `Cashout Antecipado de Aposta Esportiva`
    );

    return {
      betId,
      cashoutAmount,
      status: "CASHED_OUT",
    };
  }
}
