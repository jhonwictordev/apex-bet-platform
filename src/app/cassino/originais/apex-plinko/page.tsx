"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { Layers, ArrowLeft, ShieldCheck, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function ApexPlinkoPage() {
  const { user, refreshUser } = useAuth();

  const [betAmount, setBetAmount] = useState<number>(20);
  const [rows, setRows] = useState<number>(12);
  const [risk, setRisk] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [isDropping, setIsDropping] = useState(false);
  const [landingSlot, setLandingSlot] = useState<number | null>(null);
  const [lastMultiplier, setLastMultiplier] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Default 12 rows medium table
  const multiplierTable = [33.0, 11.0, 4.0, 2.0, 1.1, 0.6, 0.3, 0.6, 1.1, 2.0, 4.0, 11.0, 33.0];

  const handleDrop = async () => {
    if (!user) {
      setError("Faça login para jogar.");
      return;
    }
    if (betAmount <= 0) {
      setError("Insira um valor de aposta válido.");
      return;
    }
    if ((user.wallet?.demoBalance || 0) < betAmount) {
      setError("Saldo virtual insuficiente. Recarregue no botão Faucet do cabeçalho.");
      return;
    }

    setError(null);
    setIsDropping(true);
    setLandingSlot(null);

    try {
      const res = await fetch("/api/casino/plinko", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          betAmount,
          rows,
          risk,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Falha ao soltar bola.");
        setIsDropping(false);
        return;
      }

      // Simulate drop time
      setTimeout(async () => {
        setLandingSlot(data.data.slotIndex);
        setLastMultiplier(data.data.multiplier);
        setIsDropping(false);
        await refreshUser();
      }, 1200);
    } catch (e: any) {
      setError(e.message);
      setIsDropping(false);
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-brand-surface border border-brand-border rounded-3xl p-6 shadow-2xl">
        {/* Controls Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-brand-border">
            <Layers className="w-5 h-5 text-brand-accent" />
            <h2 className="font-extrabold text-base text-white">Apex Plinko</h2>
          </div>

          {error && (
            <div className="p-3 bg-red-950/70 border border-red-800 rounded-xl text-xs text-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Stake Input */}
          <div>
            <label className="block text-xs font-semibold text-brand-textSecondary mb-1.5">
              Valor da Aposta (Virtual)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-bold text-brand-textMuted">R$</span>
              <input
                type="number"
                disabled={isDropping}
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(1, Number(e.target.value)))}
                className="w-full pl-9 pr-3 py-2.5 bg-brand-darkest border border-brand-border rounded-xl text-sm font-bold text-white focus:outline-none focus:border-brand-accent disabled:opacity-50"
              />
            </div>
          </div>

          {/* Risk Level */}
          <div>
            <label className="block text-xs font-semibold text-brand-textSecondary mb-1.5">
              Nível de Risco
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(["LOW", "MEDIUM", "HIGH"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  disabled={isDropping}
                  onClick={() => setRisk(r)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    risk === r
                      ? "bg-brand-accent text-brand-darkest border-brand-accent shadow-glow"
                      : "bg-brand-darkest border-brand-border text-brand-textSecondary hover:text-white"
                  }`}
                >
                  {r === "LOW" ? "Baixo" : r === "MEDIUM" ? "Médio" : "Alto"}
                </button>
              ))}
            </div>
          </div>

          {/* Rows Selector */}
          <div>
            <label className="block text-xs font-semibold text-brand-textSecondary mb-1.5">
              Linhas de Pinos: {rows}
            </label>
            <input
              type="range"
              min="8"
              max="16"
              step="2"
              disabled={isDropping}
              value={rows}
              onChange={(e) => setRows(Number(e.target.value))}
              className="w-full accent-brand-accent cursor-pointer"
            />
          </div>

          {/* Action Button */}
          <button
            onClick={handleDrop}
            disabled={isDropping}
            className="w-full py-4 bg-brand-accent text-brand-darkest font-black text-sm rounded-2xl hover:bg-brand-accentHover transition-all shadow-glow disabled:opacity-50"
          >
            {isDropping ? "BOLA EM QUEDA..." : `SOLTAR BOLA (${formatCurrency(betAmount)})`}
          </button>

          {lastMultiplier !== null && (
            <div className="p-3 bg-brand-darkest border border-brand-accent/40 rounded-xl text-center space-y-1 animate-in zoom-in-95">
              <span className="text-[11px] text-brand-textMuted uppercase font-bold">Resultado</span>
              <p className="text-xl font-black text-brand-accent">
                {lastMultiplier}x • {formatCurrency(betAmount * lastMultiplier)}
              </p>
            </div>
          )}
        </div>

        {/* Peg Board Simulation */}
        <div className="md:col-span-2 bg-brand-darkest border border-brand-border rounded-2xl p-6 flex flex-col justify-between items-center relative overflow-hidden min-h-[380px]">
          {/* Animated dropping ball */}
          {isDropping && (
            <div className="w-4 h-4 rounded-full bg-brand-accent shadow-glow absolute top-8 animate-bounce" />
          )}

          {/* Pyramid of Pegs */}
          <div className="flex-1 flex flex-col justify-around w-full py-4 space-y-3">
            {Array.from({ length: 8 }, (_, rIdx) => (
              <div key={rIdx} className="flex justify-center gap-4 sm:gap-6">
                {Array.from({ length: rIdx + 3 }, (_, pIdx) => (
                  <div
                    key={pIdx}
                    className="w-2 h-2 rounded-full bg-brand-textSecondary/40 shadow-sm"
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Multipliers buckets at bottom */}
          <div className="w-full grid grid-cols-7 sm:grid-cols-13 gap-1 pt-4 border-t border-brand-border/60">
            {multiplierTable.map((m, idx) => {
              const isHit = landingSlot === idx;
              return (
                <div
                  key={idx}
                  className={`py-1.5 px-0.5 rounded text-center font-black text-[10px] transition-all ${
                    isHit
                      ? "bg-brand-accent text-brand-darkest shadow-glow scale-110"
                      : m >= 10
                      ? "bg-red-950/80 text-red-400 border border-red-800"
                      : m >= 2
                      ? "bg-orange-950/80 text-orange-400 border border-orange-800"
                      : "bg-brand-card text-brand-textMuted border border-brand-border"
                  }`}
                >
                  {m}x
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
