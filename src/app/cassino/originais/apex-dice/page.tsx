"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { Gamepad2, ArrowLeft, ShieldCheck, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function ApexDicePage() {
  const { user, refreshUser } = useAuth();

  const [betAmount, setBetAmount] = useState<number>(20);
  const [target, setTarget] = useState<number>(50.0);
  const [condition, setCondition] = useState<"ROLL_OVER" | "ROLL_UNDER">("ROLL_OVER");
  const [isRolling, setIsRolling] = useState(false);
  const [rollResult, setRollResult] = useState<{
    rollValue: number;
    isWon: boolean;
    multiplier: number;
    payout: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Math calculation
  const winChance = condition === "ROLL_OVER" ? 100 - target : target;
  const multiplier = Number(((100 * 0.99) / winChance).toFixed(4));

  const handleRoll = async () => {
    if (!user) {
      setError("Faça login para jogar.");
      return;
    }
    if (betAmount <= 0) {
      setError("Insira uma aposta válida.");
      return;
    }
    if ((user.wallet?.demoBalance || 0) < betAmount) {
      setError("Saldo virtual insuficiente. Recarregue no botão Faucet do cabeçalho.");
      return;
    }

    setError(null);
    setIsRolling(true);

    try {
      const res = await fetch("/api/casino/dice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          betAmount,
          target,
          condition,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Falha ao rolar dados.");
        setIsRolling(false);
        return;
      }

      setRollResult(data.data);
      setIsRolling(false);
      await refreshUser();
    } catch (e: any) {
      setError(e.message);
      setIsRolling(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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
          <span>RNG Provably Fair no Servidor</span>
        </div>
      </div>

      <div className="bg-brand-surface border border-brand-border rounded-3xl p-6 shadow-2xl space-y-8">
        {/* Dice Visual Roll Result */}
        <div className="bg-brand-darkest border border-brand-border rounded-2xl p-8 flex flex-col items-center justify-center min-h-[180px]">
          {isRolling ? (
            <div className="text-4xl font-black text-brand-accent animate-pulse">
              Rolando dados...
            </div>
          ) : rollResult ? (
            <div className="text-center space-y-2 animate-in zoom-in-95">
              <span
                className={`text-6xl font-black tracking-tight ${
                  rollResult.isWon ? "text-brand-accent shadow-glow" : "text-red-500"
                }`}
              >
                {rollResult.rollValue.toFixed(2)}
              </span>
              <p className="text-sm font-black text-white">
                {rollResult.isWon
                  ? `ACERTOU! Ganho: ${formatCurrency(rollResult.payout)} (${rollResult.multiplier}x)`
                  : "ERROU! Tente ajustar a chance de vitória."}
              </p>
            </div>
          ) : (
            <div className="text-center text-brand-textMuted space-y-1">
              <span className="text-5xl font-black text-white">50.00</span>
              <p className="text-xs">Selecione seu alvo e role o dado</p>
            </div>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-950/70 border border-red-800 rounded-xl text-xs text-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Slider Controls */}
        <div className="space-y-4 px-4">
          <div className="flex justify-between items-center text-xs font-bold text-brand-textSecondary">
            <span>0</span>
            <span className="text-brand-accent text-sm">Alvo: {target.toFixed(2)}</span>
            <span>100</span>
          </div>

          <input
            type="range"
            min="2"
            max="98"
            step="1"
            value={target}
            onChange={(e) => setTarget(Number(e.target.value))}
            className="w-full accent-brand-accent cursor-pointer h-2 bg-brand-darkest rounded-lg"
          />

          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="bg-brand-darkest border border-brand-border p-3 rounded-xl text-center">
              <span className="text-[10px] uppercase font-bold text-brand-textMuted block">Multiplicador</span>
              <span className="text-base font-black text-brand-accent">{multiplier}x</span>
            </div>

            <div className="bg-brand-darkest border border-brand-border p-3 rounded-xl text-center">
              <span className="text-[10px] uppercase font-bold text-brand-textMuted block">Condição</span>
              <button
                type="button"
                onClick={() => setCondition(condition === "ROLL_OVER" ? "ROLL_UNDER" : "ROLL_OVER")}
                className="text-xs font-black text-white hover:text-brand-accent transition-colors underline decoration-dotted"
              >
                {condition === "ROLL_OVER" ? "Rolar Acima >" : "Rolar Abaixo <"}
              </button>
            </div>

            <div className="bg-brand-darkest border border-brand-border p-3 rounded-xl text-center">
              <span className="text-[10px] uppercase font-bold text-brand-textMuted block">Chance de Vitória</span>
              <span className="text-base font-black text-white">{winChance.toFixed(2)}%</span>
            </div>
          </div>
        </div>

        {/* Stake and Roll Button */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-brand-darkest border border-brand-border rounded-2xl">
          <div className="flex items-center gap-3">
            <label className="text-xs font-bold text-brand-textSecondary">Aposta:</label>
            <div className="relative w-36">
              <span className="absolute left-3 top-2 text-xs font-bold text-brand-textMuted">R$</span>
              <input
                type="number"
                disabled={isRolling}
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(1, Number(e.target.value)))}
                className="w-full pl-8 pr-2 py-1.5 bg-brand-card border border-brand-border rounded-lg text-xs font-bold text-white disabled:opacity-50"
              />
            </div>
          </div>

          <button
            onClick={handleRoll}
            disabled={isRolling}
            className="px-8 py-3 bg-brand-accent text-brand-darkest font-black text-xs rounded-xl hover:bg-brand-accentHover transition-all shadow-glow disabled:opacity-50"
          >
            {isRolling ? "ROLANDO..." : `ROLAR DADO (${formatCurrency(betAmount)})`}
          </button>
        </div>
      </div>
    </div>
  );
}
