import { prisma } from "@/lib/db";
import { recordAuditLog } from "@/server/core/audit";

export class WalletService {
  /**
   * Retrieves or creates a virtual demo wallet for a user.
   */
  static async getOrCreateWallet(userId: string) {
    let wallet = await prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId,
          demoBalance: 10000.0,
          currency: "BRL",
          totalDepositedVirtual: 10000.0,
          totalWithdrawnVirtual: 0.0,
        },
      });

      // Record initial faucet transaction
      await prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "FAUCET_CREDIT",
          amount: 10000.0,
          balanceBefore: 0.0,
          balanceAfter: 10000.0,
          description: "Saldo inicial de demonstração (créditos fictícios)",
        },
      });
    }

    return wallet;
  }

  /**
   * Debits virtual balance atomically with concurrency and balance check.
   */
  static async debitVirtualBalance(
    userId: string,
    amount: number,
    type: "CASINO_BET" | "SPORTS_BET" | "ADMIN_ADJUSTMENT",
    referenceId?: string,
    description: string = "Aposta virtual"
  ) {
    if (amount <= 0) {
      throw new Error("O valor de aposta deve ser maior que zero.");
    }

    return await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        throw new Error("Carteira não encontrada.");
      }

      if (wallet.demoBalance < amount) {
        throw new Error("Saldo virtual insuficiente para realizar a aposta.");
      }

      const balanceBefore = wallet.demoBalance;
      const balanceAfter = Number((balanceBefore - amount).toFixed(2));

      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          demoBalance: balanceAfter,
        },
      });

      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type,
          amount: -amount,
          balanceBefore,
          balanceAfter,
          referenceId,
          description,
        },
      });

      return {
        wallet: updatedWallet,
        transaction,
      };
    });
  }

  /**
   * Credits virtual balance atomically.
   */
  static async creditVirtualBalance(
    userId: string,
    amount: number,
    type: "CASINO_WIN" | "SPORTS_WIN" | "SPORTS_REFUND" | "FAUCET_CREDIT" | "ADMIN_ADJUSTMENT",
    referenceId?: string,
    description: string = "Ganho de demonstração"
  ) {
    if (amount <= 0) {
      throw new Error("O valor creditado deve ser maior que zero.");
    }

    return await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        throw new Error("Carteira não encontrada.");
      }

      const balanceBefore = wallet.demoBalance;
      const balanceAfter = Number((balanceBefore + amount).toFixed(2));

      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          demoBalance: balanceAfter,
          ...(type === "FAUCET_CREDIT"
            ? { totalDepositedVirtual: Number((wallet.totalDepositedVirtual + amount).toFixed(2)) }
            : {}),
        },
      });

      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type,
          amount,
          balanceBefore,
          balanceAfter,
          referenceId,
          description,
        },
      });

      return {
        wallet: updatedWallet,
        transaction,
      };
    });
  }

  /**
   * Refills virtual faucet credits (resets or adds demo funds).
   */
  static async refillFaucet(userId: string, targetAmount: number = 10000.0) {
    return await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        throw new Error("Carteira não encontrada.");
      }

      const diff = Number((targetAmount - wallet.demoBalance).toFixed(2));
      if (diff <= 0) {
        throw new Error("Seu saldo virtual atual já é suficiente (superior ao mínimo de recarga).");
      }

      const balanceBefore = wallet.demoBalance;
      const balanceAfter = targetAmount;

      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          demoBalance: balanceAfter,
          totalDepositedVirtual: Number((wallet.totalDepositedVirtual + diff).toFixed(2)),
        },
      });

      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "FAUCET_CREDIT",
          amount: diff,
          balanceBefore,
          balanceAfter,
          description: "Recarga de saldo virtual de demonstração",
        },
      });

      await recordAuditLog({
        actorId: userId,
        action: "FAUCET_USED",
        entity: "WALLET",
        entityId: wallet.id,
        details: { amountAdded: diff, newBalance: balanceAfter },
      });

      return {
        wallet: updatedWallet,
        transaction,
      };
    });
  }

  /**
   * Retrieves transaction history for the user.
   */
  static async getTransactionHistory(userId: string, limit: number = 50) {
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
          take: limit,
        },
      },
    });

    return wallet ? wallet.transactions : [];
  }
}
