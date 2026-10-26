"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Wallet, RefreshCw, ArrowUpRight, ArrowDownLeft, ShieldAlert, Coins } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function WalletPage() {
  const { user, refreshUser, refillFaucet } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [faucetLoading, setFaucetLoading] = useState(false);

  const loadTransactions = async () => {
    try {
      const res = await fetch("/api/wallet/transactions?limit=50");
      if (res.ok) {
        const json = await res.json();
        setTransactions(json.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const handleRefill = async () => {
    setFaucetLoading(true);
    const res = await refillFaucet();
    setFaucetLoading(false);
    if (res.success) {
      await loadTransactions();
    } else {
      alert(res.message || "Falha na recarga.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Wallet className="w-6 h-6 text-brand-accent" />
            Carteira Virtual & Extrato
          </h1>
          <p className="text-xs text-brand-textSecondary mt-0.5">
            Gerenciamento exclusivo de créditos fictícios para simulação e pesquisa.
          </p>
        </div>

        <button
          onClick={handleRefill}
          disabled={faucetLoading}
          className="px-5 py-2.5 bg-brand-accent text-brand-darkest font-black text-xs rounded-xl hover:bg-brand-accentHover transition-all shadow-glow flex items-center gap-2 disabled:opacity-50"
        >
          <Coins className="w-4 h-4" />
          {faucetLoading ? "Recarregando..." : "Recarregar Saldo Demonstrativo"}
        </button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 space-y-2 shadow-lg">
          <span className="text-xs font-bold text-brand-textMuted uppercase tracking-wider">
            Saldo Virtual Disponível
          </span>
          <p className="text-2xl md:text-3xl font-black text-brand-accent shadow-glowSm">
            {formatCurrency(user?.wallet?.demoBalance || 0)}
          </p>
          <span className="text-[11px] text-brand-textSecondary block">Moeda: BRL Fictício</span>
        </div>

        <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 space-y-2 shadow-lg">
          <span className="text-xs font-bold text-brand-textMuted uppercase tracking-wider">
            Total de Créditos Injetados
          </span>
          <p className="text-2xl font-extrabold text-white">
            {formatCurrency(user?.wallet?.totalDepositedVirtual || 0)}
          </p>
          <span className="text-[11px] text-brand-textSecondary block">Via Faucet Virtual Gratuito</span>
        </div>

        <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 space-y-2 shadow-lg">
          <span className="text-xs font-bold text-brand-textMuted uppercase tracking-wider">
            Conformidade & Regulação
          </span>
          <p className="text-sm font-bold text-brand-textSecondary flex items-center gap-1.5 pt-1">
            <ShieldAlert className="w-4 h-4 text-brand-accent" />
            Sem Conversão Monetária
          </p>
          <span className="text-[11px] text-brand-textMuted block">Proibida qualquer transação financeira real</span>
        </div>
      </div>

      {/* Transactions Statement Table */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-brand-border pb-3">
          <h2 className="font-extrabold text-base text-white">Extrato Transacional de Créditos</h2>
          <span className="text-xs text-brand-textMuted">Últimas 50 movimentações</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-brand-textMuted">Carregando extrato...</div>
        ) : transactions.length === 0 ? (
          <div className="py-12 text-center text-brand-textMuted">Nenhuma movimentação registrada.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-brand-border/60 text-brand-textMuted font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Data & Hora</th>
                  <th className="py-2.5 px-3">Tipo</th>
                  <th className="py-2.5 px-3">Descrição</th>
                  <th className="py-2.5 px-3 text-right">Valor</th>
                  <th className="py-2.5 px-3 text-right">Saldo Resultante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/40">
                {transactions.map((tx) => {
                  const isPositive = tx.amount > 0;
                  return (
                    <tr key={tx.id} className="hover:bg-brand-card/40 transition-colors">
                      <td className="py-3 px-3 text-brand-textSecondary whitespace-nowrap">
                        {new Date(tx.createdAt).toLocaleString("pt-BR")}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            isPositive
                              ? "bg-green-950/70 text-green-300 border border-green-800"
                              : "bg-red-950/70 text-red-300 border border-red-800"
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-medium text-white max-w-xs truncate">
                        {tx.description}
                      </td>
                      <td
                        className={`py-3 px-3 text-right font-extrabold whitespace-nowrap ${
                          isPositive ? "text-brand-accent" : "text-red-400"
                        }`}
                      >
                        {isPositive ? `+${formatCurrency(tx.amount)}` : formatCurrency(tx.amount)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-white whitespace-nowrap">
                        {formatCurrency(tx.balanceAfter)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
