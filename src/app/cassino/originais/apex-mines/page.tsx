"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { Sparkles, ArrowLeft, Bomb, Diamond, ShieldCheck, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function ApexMinesPage() {
  const { user, refreshUser } = useAuth();

  const [betAmount, setBetAmount] = useState<number>(25);
  const [minesCount, setMinesCount] = useState<number>(3);
  const [gameId, setGameId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [revealed, setRevealed] = useState<number[]>([]);
  const [minesPositions, setMinesPositions] = useState<number[]>([]);
  const [explodedTile, setExplodedTile] = useState<number | null>(null);
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1.0);
  const [nextMultiplier, setNextMultiplier] = useState<number>(1.1);
  const [error, setError] = useState<string | null>(null);
  const [wonAmount, setWonAmount] = useState<number | null>(null);

  const handleStartGame = async () => {
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
    setWonAmount(null);
    setExplodedTile(null);
    setMinesPositions([]);
    setRevealed([]);

    try {
      const res = await fetch("/api/casino/mines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "START",
          betAmount,
          minesCount,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Falha ao iniciar o jogo de minas.");
        return;
      }

      await refreshUser();
      setGameId(data.data.gameId);
      setIsPlaying(true);
      setCurrentMultiplier(1.0);
      setNextMultiplier(data.data.nextMultiplier);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handlePickTile = async (index: number) => {
    if (!isPlaying || !gameId || revealed.includes(index)) return;

    try {
      const res = await fetch("/api/casino/mines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "PICK",
          gameId,
          tileIndex: index,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Falha ao abrir peça.");
        return;
      }

      if (data.data.isMine) {
        // Exploded!
        setExplodedTile(index);
        setMinesPositions(data.data.allMines || []);
        setIsPlaying(false);
        setGameId(null);
        await refreshUser();
      } else {
        // Safe gem
        setRevealed(data.data.revealedPositions);
        setCurrentMultiplier(data.data.currentMultiplier);
        setNextMultiplier(data.data.nextMultiplier);
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleCashout = async () => {
    if (!isPlaying || !gameId) return;

    try {
      const res = await fetch("/api/casino/mines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CASHOUT",
          gameId,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsPlaying(false);
        setWonAmount(data.data.payout);
        setMinesPositions(data.data.allMines || []);
        setGameId(null);
        await refreshUser();
      } else {
        setError(data.error || "Falha ao realizar cashout.");
      }
    } catch (e: any) {
      setError(e.message);
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
            <Sparkles className="w-5 h-5 text-brand-accent" />
            <h2 className="font-extrabold text-base text-white">Apex Mines</h2>
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
                disabled={isPlaying}
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(1, Number(e.target.value)))}
                className="w-full pl-9 pr-3 py-2.5 bg-brand-darkest border border-brand-border rounded-xl text-sm font-bold text-white focus:outline-none focus:border-brand-accent disabled:opacity-50"
              />
            </div>
          </div>

          {/* Mines Count Selector */}
          <div>
            <label className="block text-xs font-semibold text-brand-textSecondary mb-1.5">
              Número de Minas (1 a 24)
            </label>
            <select
              disabled={isPlaying}
              value={minesCount}
              onChange={(e) => setMinesCount(Number(e.target.value))}
              className="w-full px-3 py-2.5 bg-brand-darkest border border-brand-border rounded-xl text-sm font-bold text-white focus:outline-none focus:border-brand-accent disabled:opacity-50"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 24].map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? "Mina" : "Minas"}
                </option>
              ))}
            </select>
          </div>

          {/* Multiplier Info Box */}
          {isPlaying && (
            <div className="bg-brand-darkest border border-brand-border rounded-xl p-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-brand-textSecondary">
                <span>Multiplicador Atual:</span>
                <span className="font-bold text-brand-accent text-sm">
                  {currentMultiplier.toFixed(2)}x
                </span>
              </div>
              <div className="flex justify-between text-brand-textSecondary">
                <span>Próximo Diamante:</span>
                <span className="font-bold text-white">{nextMultiplier.toFixed(2)}x</span>
              </div>
              <div className="flex justify-between text-brand-textSecondary pt-1 border-t border-brand-border/40 font-bold">
                <span>Ganho no Cashout:</span>
                <span className="text-brand-accent">
                  {formatCurrency(betAmount * currentMultiplier)}
                </span>
              </div>
            </div>
          )}

          {/* Action Button */}
          {isPlaying ? (
            <button
              onClick={handleCashout}
              disabled={revealed.length === 0}
              className="w-full py-4 bg-brand-accent text-brand-darkest font-black text-sm rounded-2xl hover:bg-brand-accentHover transition-all shadow-glow disabled:opacity-50 flex flex-col items-center justify-center leading-tight"
            >
              <span>FAZER CASHOUT</span>
              <span className="text-xs font-bold text-brand-darkest/90">
                {formatCurrency(betAmount * currentMultiplier)}
              </span>
            </button>
          ) : (
            <button
              onClick={handleStartGame}
              className="w-full py-4 bg-brand-accent text-brand-darkest font-black text-sm rounded-2xl hover:bg-brand-accentHover transition-all shadow-glow"
            >
              JOGAR AGORA ({formatCurrency(betAmount)})
            </button>
          )}

          {wonAmount !== null && (
            <div className="p-3 bg-green-950/70 border border-green-800 rounded-xl text-center text-green-200 text-xs font-bold animate-in zoom-in-95">
              🎉 Cashout bem-sucedido! Prêmio de {formatCurrency(wonAmount)} creditado!
            </div>
          )}
        </div>

        {/* 5x5 Tiles Grid */}
        <div className="md:col-span-2 aspect-square max-w-[480px] mx-auto w-full grid grid-cols-5 gap-2.5 p-3 bg-brand-darkest border border-brand-border rounded-2xl">
          {Array.from({ length: 25 }, (_, i) => {
            const isRevealedGem = revealed.includes(i);
            const isExploded = explodedTile === i;
            const isHiddenMine = minesPositions.includes(i);

            return (
              <button
                key={i}
                type="button"
                disabled={!isPlaying || isRevealedGem}
                onClick={() => handlePickTile(i)}
                className={`relative rounded-xl flex items-center justify-center transition-all duration-200 font-black text-lg select-none ${
                  isRevealedGem
                    ? "bg-green-950/80 border-2 border-brand-accent text-brand-accent shadow-glow"
                    : isExploded
                    ? "bg-red-950 border-2 border-red-600 text-red-500 animate-bounce"
                    : isHiddenMine
                    ? "bg-red-950/40 border border-red-800/60 text-red-400 opacity-60"
                    : isPlaying
                    ? "bg-brand-card hover:bg-brand-cardHover border border-brand-border hover:border-brand-accent/60 cursor-pointer hover:scale-105 active:scale-95"
                    : "bg-brand-card/70 border border-brand-border/40 opacity-70"
                }`}
              >
                {isRevealedGem ? (
                  <Diamond className="w-7 h-7 text-brand-accent animate-in zoom-in-75 duration-150" />
                ) : isExploded || isHiddenMine ? (
                  <Bomb className="w-7 h-7 text-red-500 animate-in zoom-in-75 duration-150" />
                ) : (
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-border/80" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
