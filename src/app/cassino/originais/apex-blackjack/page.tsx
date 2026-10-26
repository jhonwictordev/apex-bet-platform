"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { Trophy, ArrowLeft, ShieldCheck, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Card {
  suit: string;
  rank: string;
  value: number;
}

export default function ApexBlackjackPage() {
  const { user, refreshUser } = useAuth();

  const [betAmount, setBetAmount] = useState<number>(50);
  const [gameId, setGameId] = useState<string | null>(null);
  const [playerCards, setPlayerCards] = useState<Card[]>([]);
  const [dealerCards, setDealerCards] = useState<Card[]>([]);
  const [playerScore, setPlayerScore] = useState<number>(0);
  const [dealerScore, setDealerScore] = useState<number>(0);
  const [status, setStatus] = useState<string>("IDLE");
  const [payout, setPayout] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const handleDeal = async () => {
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
    setPayout(0);

    try {
      const res = await fetch("/api/casino/blackjack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DEAL",
          betAmount,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Falha ao iniciar mão.");
        return;
      }

      const st = data.data.state;
      setGameId(st.id);
      setPlayerCards(st.playerCards);
      setDealerCards(st.dealerCards);
      setPlayerScore(st.playerScore);
      setDealerScore(st.dealerScore);
      setStatus(st.status);
      setPayout(st.payout);

      await refreshUser();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleHit = async () => {
    if (!gameId || status !== "IN_PROGRESS") return;

    try {
      const res = await fetch("/api/casino/blackjack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "HIT",
          gameId,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const st = data.data.state;
        setPlayerCards(st.playerCards);
        setPlayerScore(st.playerScore);
        setStatus(st.status);
        if (st.status !== "IN_PROGRESS") {
          await refreshUser();
        }
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleStand = async () => {
    if (!gameId || status !== "IN_PROGRESS") return;

    try {
      const res = await fetch("/api/casino/blackjack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "STAND",
          gameId,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const st = data.data.state;
        setDealerCards(st.dealerCards);
        setDealerScore(st.dealerScore);
        setStatus(st.status);
        setPayout(st.payout);
        await refreshUser();
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case "BLACKJACK":
        return "BLACKJACK NATURAL! (Paga 3:2)";
      case "PLAYER_WIN":
        return "VOCÊ VENCEU A MESA! 🎉";
      case "DEALER_BUST":
        return "O DEALER ESTOUROU! VOCÊ VENCEU! 🎉";
      case "PLAYER_BUST":
        return "VOCÊ ESTOUROU (BUST)";
      case "DEALER_WIN":
        return "DEALER VENCEU";
      case "PUSH":
        return "EMPATE (PUSH) - Aposta Devolvida";
      default:
        return "Sua vez de jogar";
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
          <span>Blackjack Clássico 6 Baralhos</span>
        </div>
      </div>

      <div className="bg-brand-surface border border-brand-border rounded-3xl p-6 shadow-2xl space-y-6">
        {/* Blackjack Green Felt Table */}
        <div className="relative bg-emerald-950/80 border-4 border-emerald-900 rounded-3xl p-8 min-h-[420px] flex flex-col justify-between items-center shadow-inner">
          {/* Dealer Area */}
          <div className="flex flex-col items-center space-y-2">
            <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-300/80">
              Dealer {status !== "IN_PROGRESS" && status !== "IDLE" ? `(${dealerScore})` : ""}
            </span>
            <div className="flex items-center gap-3">
              {dealerCards.map((c, i) => (
                <div
                  key={i}
                  className="w-16 h-24 bg-white text-zinc-900 rounded-xl font-black text-sm flex flex-col justify-between p-2 shadow-2xl border border-zinc-200 animate-in zoom-in-75"
                >
                  <span className={c.suit === "♥" || c.suit === "♦" ? "text-red-600" : "text-black"}>
                    {c.rank}
                  </span>
                  <span className={`text-2xl self-center ${c.suit === "♥" || c.suit === "♦" ? "text-red-600" : "text-black"}`}>
                    {c.suit}
                  </span>
                  <span className={`self-end ${c.suit === "♥" || c.suit === "♦" ? "text-red-600" : "text-black"}`}>
                    {c.rank}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Middle Status Board */}
          {status !== "IDLE" && (
            <div className="p-3 bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl text-center space-y-1">
              <span className="text-base font-black text-white">{getStatusLabel()}</span>
              {payout > 0 && (
                <p className="text-sm font-black text-brand-accent">
                  Ganho: {formatCurrency(payout)}
                </p>
              )}
            </div>
          )}

          {/* Player Area */}
          <div className="flex flex-col items-center space-y-2">
            <div className="flex items-center gap-3">
              {playerCards.map((c, i) => (
                <div
                  key={i}
                  className="w-16 h-24 bg-white text-zinc-900 rounded-xl font-black text-sm flex flex-col justify-between p-2 shadow-2xl border border-zinc-200 animate-in zoom-in-75"
                >
                  <span className={c.suit === "♥" || c.suit === "♦" ? "text-red-600" : "text-black"}>
                    {c.rank}
                  </span>
                  <span className={`text-2xl self-center ${c.suit === "♥" || c.suit === "♦" ? "text-red-600" : "text-black"}`}>
                    {c.suit}
                  </span>
                  <span className={`self-end ${c.suit === "♥" || c.suit === "♦" ? "text-red-600" : "text-black"}`}>
                    {c.rank}
                  </span>
                </div>
              ))}
            </div>
            <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-300/80">
              Sua Mão {playerScore > 0 ? `(${playerScore})` : ""}
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-950/70 border border-red-800 rounded-xl text-xs text-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-brand-darkest border border-brand-border rounded-2xl">
          <div className="flex items-center gap-3">
            <label className="text-xs font-bold text-brand-textSecondary">Aposta:</label>
            <div className="relative w-36">
              <span className="absolute left-3 top-2 text-xs font-bold text-brand-textMuted">R$</span>
              <input
                type="number"
                disabled={status === "IN_PROGRESS"}
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(1, Number(e.target.value)))}
                className="w-full pl-8 pr-2 py-1.5 bg-brand-card border border-brand-border rounded-lg text-xs font-bold text-white disabled:opacity-50"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {status === "IN_PROGRESS" ? (
              <>
                <button
                  onClick={handleHit}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl font-black text-xs text-white transition-all shadow-md"
                >
                  PEDIR CARTA (HIT)
                </button>
                <button
                  onClick={handleStand}
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 rounded-xl font-black text-xs text-white transition-all shadow-md"
                >
                  PARAR (STAND)
                </button>
              </>
            ) : (
              <button
                onClick={handleDeal}
                className="px-8 py-2.5 bg-brand-accent text-brand-darkest font-black text-xs rounded-xl hover:bg-brand-accentHover transition-all shadow-glow"
              >
                DAR CARTAS ({formatCurrency(betAmount)})
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
