"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import {
  ArrowLeft,
  Maximize2,
  RefreshCw,
  ShieldCheck,
  Gamepad2,
  Sparkles,
  AlertCircle,
  Coins,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function GamePlayerPage() {
  const { slug } = useParams() as { slug: string };
  const { user, refreshUser } = useAuth();

  const [launchData, setLaunchData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Simulated slot spin state for mock sandbox mode
  const [slotReels, setSlotReels] = useState<string[]>(["👑", "⚡", "🍇", "💎", "⭐"]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [slotPayout, setSlotPayout] = useState<number | null>(null);
  const [slotBet, setSlotBet] = useState<number>(10);

  const launchSession = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/casino/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Falha ao inicializar sessão do jogo.");
        return;
      }

      setLaunchData(data.data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) {
      launchSession();
    }
  }, [slug]);

  // Interactive Spin in Mock Simulator
  const handleSimulatedSpin = async () => {
    if (!user) {
      setError("Faça login para jogar.");
      return;
    }
    if ((user.wallet?.demoBalance || 0) < slotBet) {
      setError("Saldo virtual insuficiente. Recarregue seus créditos demonstrativos.");
      return;
    }

    setIsSpinning(true);
    setSlotPayout(null);
    setError(null);

    // Call wallet debit
    try {
      const symbols = ["👑", "⚡", "🍇", "💎", "⭐", "🍒", "7️⃣", "🔔"];
      const newReels = [
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
      ];

      setTimeout(async () => {
        setSlotReels(newReels);
        setIsSpinning(false);

        // Check matching symbols
        const isTriple = newReels[0] === newReels[1] && newReels[1] === newReels[2];
        const isPair = newReels[0] === newReels[1] || newReels[1] === newReels[2] || newReels[0] === newReels[2];

        let win = 0;
        if (isTriple) win = slotBet * 10;
        else if (isPair) win = slotBet * 2;

        setSlotPayout(win);
        await refreshUser();
      }, 1000);
    } catch (e: any) {
      setError(e.message);
      setIsSpinning(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/cassino"
          className="flex items-center gap-2 text-xs font-bold text-brand-textSecondary hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar ao Lobby
        </Link>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-brand-surface border border-brand-border text-xs text-brand-accent font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            Sessão Demo Autorizada
          </span>
          <button
            onClick={launchSession}
            className="p-1.5 bg-brand-surface hover:bg-brand-card border border-brand-border rounded-lg text-brand-textSecondary hover:text-white transition-colors"
            title="Recarregar Sessão"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-950/70 border border-red-800 rounded-xl text-xs text-red-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Game Window Container */}
      <div className="bg-brand-surface border border-brand-border rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Game Topbar */}
        <div className="px-6 py-3.5 bg-brand-darkest border-b border-brand-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-card border border-brand-border flex items-center justify-center text-brand-accent">
              <Gamepad2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">
                {launchData?.gameTitle || slug}
              </h2>
              <span className="text-[10px] text-brand-textMuted uppercase tracking-wider font-semibold">
                Provedor: {launchData?.provider || "Integração B2B"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-brand-textSecondary hidden sm:inline">
              Saldo: <strong className="text-brand-accent">{formatCurrency(user?.wallet?.demoBalance || 0)}</strong>
            </span>
          </div>
        </div>

        {/* Viewport Area */}
        <div className="aspect-[16/9] w-full bg-brand-darkest relative flex items-center justify-center min-h-[460px]">
          {loading ? (
            <div className="flex flex-col items-center gap-3 text-brand-textMuted">
              <div className="w-10 h-10 border-4 border-brand-accent border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-bold">Inicializando motor de jogo demonstrativo...</span>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 space-y-6">
              {/* Slot Reels Simulator */}
              <div className="space-y-4 text-center">
                <span className="px-3 py-1 rounded-full text-xs font-black bg-brand-accent/20 border border-brand-accent/40 text-brand-accent">
                  MODO DEMONSTRAÇÃO OFICIAL
                </span>
                <p className="text-xs text-brand-textMuted max-w-md mx-auto">
                  Rodando via cliente de teste autorizado no Sandbox Apex. Todos os créditos e rotações são 100% fictícios.
                </p>

                {/* 3 Reels Display */}
                <div className="flex items-center justify-center gap-4 py-6">
                  {slotReels.map((sym, idx) => (
                    <div
                      key={idx}
                      className={`w-24 h-28 bg-brand-card border-2 rounded-2xl flex items-center justify-center text-5xl shadow-2xl transition-all ${
                        isSpinning ? "animate-pulse border-brand-accent scale-95" : "border-brand-border"
                      }`}
                    >
                      {sym}
                    </div>
                  ))}
                </div>

                {slotPayout !== null && (
                  <div className="text-base font-black animate-in zoom-in-95">
                    {slotPayout > 0 ? (
                      <span className="text-brand-accent shadow-glow">
                        🎉 PARABÉNS! GANHO VIRTUAL: {formatCurrency(slotPayout)}!
                      </span>
                    ) : (
                      <span className="text-brand-textMuted">Tente novamente na próxima rodada!</span>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Spin Control */}
              <div className="flex items-center gap-4 bg-brand-surface border border-brand-border p-3 rounded-2xl">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-brand-textSecondary">Aposta Virtual:</span>
                  {[5, 10, 25, 50].map((v) => (
                    <button
                      key={v}
                      type="button"
                      disabled={isSpinning}
                      onClick={() => setSlotBet(v)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                        slotBet === v
                          ? "bg-brand-accent text-brand-darkest border-brand-accent"
                          : "bg-brand-darkest border-brand-border text-brand-textSecondary hover:text-white"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleSimulatedSpin}
                  disabled={isSpinning}
                  className="px-8 py-3 bg-brand-accent text-brand-darkest font-black text-xs rounded-xl hover:bg-brand-accentHover transition-all shadow-glow disabled:opacity-50 flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  {isSpinning ? "GIRANDO..." : `GIRAR (${formatCurrency(slotBet)})`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
