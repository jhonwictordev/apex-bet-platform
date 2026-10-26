"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { Flame, ArrowLeft, ShieldCheck, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

export default function ApexRoulettePage() {
  const { user, refreshUser } = useAuth();

  const [chipValue, setChipValue] = useState<number>(10);
  const [selectedBets, setSelectedBets] = useState<{ type: string; value?: number; amount: number }[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<{
    winningNumber: number;
    color: string;
    totalPayout: number;
    isWon: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addBet = (type: string, value?: number) => {
    if (isSpinning) return;
    setError(null);

    setSelectedBets((prev) => {
      const existingIdx = prev.findIndex((b) => b.type === type && b.value === value);
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx].amount += chipValue;
        return copy;
      }
      return [...prev, { type, value, amount: chipValue }];
    });
  };

  const clearBets = () => {
    if (!isSpinning) setSelectedBets([]);
  };

  const totalStake = selectedBets.reduce((acc, b) => acc + b.amount, 0);

  const handleSpin = async () => {
    if (!user) {
      setError("Faça login para jogar.");
      return;
    }
    if (selectedBets.length === 0) {
      setError("Coloque fichas na mesa antes de girar.");
      return;
    }
    if ((user.wallet?.demoBalance || 0) < totalStake) {
      setError("Saldo virtual insuficiente. Recarregue no botão Faucet do cabeçalho.");
      return;
    }

    setError(null);
    setIsSpinning(true);
    setSpinResult(null);

    try {
      const res = await fetch("/api/casino/roulette", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bets: selectedBets }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Falha ao girar roleta.");
        setIsSpinning(false);
        return;
      }

      // 2 seconds spin animation
      setTimeout(async () => {
        setSpinResult(data.data);
        setIsSpinning(false);
        await refreshUser();
      }, 2000);
    } catch (e: any) {
      setError(e.message);
      setIsSpinning(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/cassino"
          className="flex items-center gap-2 text-xs font-bold text-brand-textSecondary hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar ao Cassino
        </Link>
        <div className="flex items-center gap-2 text-xs text-brand-accent bg-brand-surface px-3 py-1 rounded-full border border-brand-border">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Roleta Europeia RNG Servidor</span>
        </div>
      </div>

      <div className="bg-brand-surface border border-brand-border rounded-3xl p-6 shadow-2xl space-y-6">
        {/* Wheel Display & Result */}
        <div className="relative bg-brand-darkest border border-brand-border rounded-2xl p-6 flex flex-col items-center justify-center min-h-[160px] overflow-hidden">
          {isSpinning ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full border-4 border-brand-accent border-t-transparent animate-spin" />
              <span className="text-sm font-black text-brand-accent animate-pulse uppercase tracking-wider">
                A roleta está girando...
              </span>
            </div>
          ) : spinResult ? (
            <div className="flex flex-col items-center gap-2 animate-in zoom-in-95">
              <div
                className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-black text-white shadow-2xl ${
                  spinResult.color === "green"
                    ? "bg-emerald-600 border-4 border-emerald-400"
                    : spinResult.color === "red"
                    ? "bg-red-600 border-4 border-red-400"
                    : "bg-zinc-800 border-4 border-zinc-500"
                }`}
              >
                {spinResult.winningNumber}
              </div>
              <p className="text-sm font-black text-white">
                {spinResult.isWon
                  ? `Parabéns! Ganho de ${formatCurrency(spinResult.totalPayout)}`
                  : "Não foi dessa vez. Tente novamente!"}
              </p>
            </div>
          ) : (
            <div className="text-center text-brand-textMuted space-y-1">
              <Flame className="w-10 h-10 text-brand-accent mx-auto mb-2 opacity-80" />
              <p className="text-sm font-bold text-white">Mesa de Roleta Europeia</p>
              <p className="text-xs">Selecione suas fichas e clique nas opções de aposta.</p>
            </div>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-950/70 border border-red-800 rounded-xl text-xs text-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Chips Selector & Quick Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-brand-darkest border border-brand-border rounded-2xl">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-brand-textSecondary">Ficha:</span>
            {[5, 10, 25, 50, 100, 250].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setChipValue(val)}
                className={`w-10 h-10 rounded-full font-black text-xs border-2 flex items-center justify-center transition-all ${
                  chipValue === val
                    ? "bg-brand-accent text-brand-darkest border-white scale-110 shadow-glow"
                    : "bg-brand-card text-white border-brand-border hover:border-brand-accent"
                }`}
              >
                {val}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-brand-textSecondary">
              Total Apostado: <strong className="text-brand-accent">{formatCurrency(totalStake)}</strong>
            </span>
            <button
              onClick={clearBets}
              disabled={isSpinning || selectedBets.length === 0}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-brand-card hover:bg-brand-cardHover border border-brand-border text-brand-textSecondary hover:text-white disabled:opacity-50"
            >
              Limpar
            </button>
            <button
              onClick={handleSpin}
              disabled={isSpinning || selectedBets.length === 0}
              className="px-6 py-2.5 rounded-xl font-black text-xs bg-brand-accent text-brand-darkest hover:bg-brand-accentHover transition-all shadow-glow disabled:opacity-50"
            >
              {isSpinning ? "Girando..." : "GIRAR ROLETA"}
            </button>
          </div>
        </div>

        {/* Roulette Betting Grid */}
        <div className="space-y-2 overflow-x-auto pb-2">
          {/* Numbers Grid (0 to 36) */}
          <div className="flex gap-1 min-w-[700px]">
            {/* Number 0 */}
            <button
              type="button"
              onClick={() => addBet("straight", 0)}
              className="w-12 bg-emerald-700 hover:bg-emerald-600 rounded-lg font-black text-white text-sm flex items-center justify-center border border-emerald-500"
            >
              0
            </button>

            {/* 36 numbers */}
            <div className="grid grid-cols-12 gap-1 flex-1">
              {Array.from({ length: 36 }, (_, i) => {
                const num = i + 1;
                const isRed = RED_NUMBERS.includes(num);
                const currentBet = selectedBets.find((b) => b.type === "straight" && b.value === num);

                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => addBet("straight", num)}
                    className={`h-11 rounded-lg font-black text-xs flex flex-col items-center justify-center border transition-all ${
                      isRed
                        ? "bg-red-700 hover:bg-red-600 border-red-500 text-white"
                        : "bg-zinc-800 hover:bg-zinc-700 border-zinc-600 text-white"
                    } ${currentBet ? "ring-2 ring-brand-accent shadow-glow" : ""}`}
                  >
                    <span>{num}</span>
                    {currentBet && (
                      <span className="text-[9px] text-brand-accent bg-black/60 px-1 rounded font-bold">
                        {currentBet.amount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Outside Bets (Red/Black, Even/Odd, Dozens) */}
          <div className="grid grid-cols-6 gap-2 min-w-[700px]">
            <button
              type="button"
              onClick={() => addBet("red")}
              className="py-3 bg-red-700 hover:bg-red-600 rounded-xl font-black text-xs text-white border border-red-500"
            >
              VERMELHO (2x)
            </button>
            <button
              type="button"
              onClick={() => addBet("black")}
              className="py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-black text-xs text-white border border-zinc-600"
            >
              PRETO (2x)
            </button>
            <button
              type="button"
              onClick={() => addBet("even")}
              className="py-3 bg-brand-card hover:bg-brand-cardHover rounded-xl font-black text-xs text-brand-textSecondary hover:text-white border border-brand-border"
            >
              PAR (2x)
            </button>
            <button
              type="button"
              onClick={() => addBet("odd")}
              className="py-3 bg-brand-card hover:bg-brand-cardHover rounded-xl font-black text-xs text-brand-textSecondary hover:text-white border border-brand-border"
            >
              ÍMPAR (2x)
            </button>
            <button
              type="button"
              onClick={() => addBet("dozen1")}
              className="py-3 bg-brand-card hover:bg-brand-cardHover rounded-xl font-black text-xs text-brand-textSecondary hover:text-white border border-brand-border"
            >
              1º DÚZIA (1-12) (3x)
            </button>
            <button
              type="button"
              onClick={() => addBet("dozen2")}
              className="py-3 bg-brand-card hover:bg-brand-cardHover rounded-xl font-black text-xs text-brand-textSecondary hover:text-white border border-brand-border"
            >
              2º DÚZIA (13-24) (3x)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
