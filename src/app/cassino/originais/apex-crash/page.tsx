"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { Zap, ArrowLeft, RefreshCw, Trophy, AlertTriangle, ShieldCheck } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function ApexCrashPage() {
  const { user, refreshUser } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [betAmount, setBetAmount] = useState<number>(20);
  const [autoCashout, setAutoCashout] = useState<string>("2.00");
  const [gameState, setGameState] = useState<"IDLE" | "RUNNING" | "CRASHED" | "WON">("IDLE");
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1.0);
  const [crashPoint, setCrashPoint] = useState<number | null>(null);
  const [roundId, setRoundId] = useState<string | null>(null);
  const [winPayout, setWinPayout] = useState<number>(0);
  const [history, setHistory] = useState<number[]>([1.45, 2.8, 1.12, 5.4, 1.02, 14.2, 1.88]);
  const [error, setError] = useState<string | null>(null);

  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const targetCrashRef = useRef<number>(1.0);

  // Handle Starting a Bet
  const handleStartBet = async () => {
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
    setGameState("RUNNING");
    setCurrentMultiplier(1.0);
    setCrashPoint(null);
    setWinPayout(0);

    try {
      const res = await fetch("/api/casino/crash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "BET",
          betAmount,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Falha ao iniciar rodada.");
        setGameState("IDLE");
        return;
      }

      await refreshUser();
      setRoundId(data.data.roundId);
      targetCrashRef.current = data.data.crashPoint;
      startTimeRef.current = Date.now();

      // Start animation loop
      runFlightLoop(data.data.roundId, data.data.crashPoint);
    } catch (e: any) {
      setError(e.message);
      setGameState("IDLE");
    }
  };

  // Run Real-time Flight Loop
  const runFlightLoop = (activeRoundId: string, targetPoint: number) => {
    const autoMultiplier = parseFloat(autoCashout);

    const step = () => {
      const elapsedSeconds = (Date.now() - startTimeRef.current) / 1000;
      // Exponential growth curve: multiplier = e^(0.06 * elapsedSeconds^1.3)
      const calculatedMult = Number(Math.max(1.0, Math.exp(0.06 * Math.pow(elapsedSeconds * 2.5, 1.15))).toFixed(2));

      // Check auto-cashout
      if (!isNaN(autoMultiplier) && autoMultiplier > 1.0 && calculatedMult >= autoMultiplier && calculatedMult < targetPoint) {
        handleCashout(activeRoundId, autoMultiplier);
        return;
      }

      // Check if crash point reached
      if (calculatedMult >= targetPoint) {
        setCurrentMultiplier(targetPoint);
        setCrashPoint(targetPoint);
        setGameState("CRASHED");
        setHistory((prev) => [targetPoint, ...prev.slice(0, 7)]);
        refreshUser();
        return;
      }

      setCurrentMultiplier(calculatedMult);
      drawFlight(calculatedMult);
      animationFrameRef.current = requestAnimationFrame(step);
    };

    animationFrameRef.current = requestAnimationFrame(step);
  };

  // Handle Manual Cashout
  const handleCashout = async (activeRoundId?: string, overrideMult?: number) => {
    const idToUse = activeRoundId || roundId;
    if (!idToUse || gameState !== "RUNNING") return;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    const multToUse = overrideMult || currentMultiplier;

    try {
      const res = await fetch("/api/casino/crash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CASHOUT",
          roundId: idToUse,
          cashoutMultiplier: multToUse,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.data.isWon) {
        setGameState("WON");
        setWinPayout(data.data.payout);
        setCurrentMultiplier(multToUse);
        setHistory((prev) => [multToUse, ...prev.slice(0, 7)]);
        await refreshUser();
      } else {
        setGameState("CRASHED");
        setCrashPoint(targetCrashRef.current);
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  // Draw rocket curve on HTML5 Canvas
  const drawFlight = (mult: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Draw grid lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Flight progress ratio (0 to 1)
    const progress = Math.min((mult - 1) / 5, 0.9);
    const startX = 30;
    const startY = height - 30;
    const endX = startX + (width - 60) * progress;
    const endY = startY - (height - 60) * Math.pow(progress, 0.8);

    // Draw glowing curve
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(startX + (endX - startX) * 0.4, startY, endX, endY);
    ctx.strokeStyle = "#B4FF39";
    ctx.lineWidth = 4;
    ctx.shadowColor = "#B4FF39";
    ctx.shadowBlur = 15;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw Rocket circle
    ctx.beginPath();
    ctx.arc(endX, endY, 8, 0, Math.PI * 2);
    ctx.fillStyle = "#FFFFFF";
    ctx.shadowColor = "#B4FF39";
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

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
          <span>RNG Provably Fair no Servidor</span>
        </div>
      </div>

      {/* Recent History Multipliers */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-bold text-brand-textMuted uppercase flex-shrink-0">
          Últimos Crash:
        </span>
        {history.map((m, idx) => (
          <span
            key={idx}
            className={`px-2.5 py-0.5 rounded-lg text-xs font-black flex-shrink-0 ${
              m >= 2.0
                ? "bg-green-950/70 text-brand-accent border border-green-800"
                : "bg-brand-card text-brand-textSecondary border border-brand-border"
            }`}
          >
            {m.toFixed(2)}x
          </span>
        ))}
      </div>

      {/* Main Game Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-brand-surface border border-brand-border rounded-3xl p-6 shadow-2xl">
        {/* Canvas & Flight Screen */}
        <div className="lg:col-span-2 relative aspect-[16/10] bg-brand-darkest rounded-2xl overflow-hidden border border-brand-border/80 flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={600}
            height={375}
            className="absolute inset-0 w-full h-full"
          />

          {/* Central Multiplier Indicator */}
          <div className="relative z-10 text-center select-none pointer-events-none">
            {gameState === "CRASHED" ? (
              <div className="space-y-1 animate-in zoom-in-90 duration-150">
                <span className="text-4xl md:text-6xl font-black text-red-500 tracking-tight">
                  {crashPoint?.toFixed(2)}x
                </span>
                <p className="text-sm font-black text-red-400 uppercase tracking-widest">
                  CRASHED!
                </p>
              </div>
            ) : gameState === "WON" ? (
              <div className="space-y-1 animate-in zoom-in-90 duration-150">
                <span className="text-4xl md:text-6xl font-black text-brand-accent tracking-tight shadow-glow">
                  {currentMultiplier.toFixed(2)}x
                </span>
                <p className="text-sm font-black text-white">
                  Ganho: {formatCurrency(winPayout)}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <span className="text-5xl md:text-7xl font-black text-white tracking-tight">
                  {currentMultiplier.toFixed(2)}x
                </span>
                {gameState === "RUNNING" && (
                  <p className="text-xs font-bold text-brand-accent animate-pulse">
                    Foguete em voo...
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Betting Controls Sidebar */}
        <div className="space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-brand-border">
              <Zap className="w-5 h-5 text-brand-accent" />
              <h2 className="font-extrabold text-base text-white">Apex Crash</h2>
            </div>

            {error && (
              <div className="p-3 bg-red-950/70 border border-red-800 rounded-xl text-xs text-red-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Stake Input */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-brand-textSecondary mb-1.5">
                <span>Valor da Aposta (Virtual)</span>
                <span>Saldo: {formatCurrency(user?.wallet?.demoBalance || 0)}</span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-brand-textMuted">R$</span>
                <input
                  type="number"
                  disabled={gameState === "RUNNING"}
                  value={betAmount}
                  onChange={(e) => setBetAmount(Math.max(1, Number(e.target.value)))}
                  className="w-full pl-9 pr-3 py-2.5 bg-brand-darkest border border-brand-border rounded-xl text-sm font-bold text-white focus:outline-none focus:border-brand-accent disabled:opacity-50"
                />
              </div>

              {/* Quick Multipliers */}
              <div className="grid grid-cols-4 gap-1.5 mt-2">
                <button
                  type="button"
                  disabled={gameState === "RUNNING"}
                  onClick={() => setBetAmount((prev) => Math.max(1, Math.floor(prev / 2)))}
                  className="py-1 bg-brand-card hover:bg-brand-cardHover border border-brand-border rounded-lg text-xs font-bold text-brand-textSecondary hover:text-white disabled:opacity-50"
                >
                  ½
                </button>
                <button
                  type="button"
                  disabled={gameState === "RUNNING"}
                  onClick={() => setBetAmount((prev) => prev * 2)}
                  className="py-1 bg-brand-card hover:bg-brand-cardHover border border-brand-border rounded-lg text-xs font-bold text-brand-textSecondary hover:text-white disabled:opacity-50"
                >
                  2x
                </button>
                <button
                  type="button"
                  disabled={gameState === "RUNNING"}
                  onClick={() => setBetAmount(50)}
                  className="py-1 bg-brand-card hover:bg-brand-cardHover border border-brand-border rounded-lg text-xs font-bold text-brand-textSecondary hover:text-white disabled:opacity-50"
                >
                  50
                </button>
                <button
                  type="button"
                  disabled={gameState === "RUNNING"}
                  onClick={() => setBetAmount(200)}
                  className="py-1 bg-brand-card hover:bg-brand-cardHover border border-brand-border rounded-lg text-xs font-bold text-brand-textSecondary hover:text-white disabled:opacity-50"
                >
                  200
                </button>
              </div>
            </div>

            {/* Auto Cashout */}
            <div>
              <label className="block text-xs font-semibold text-brand-textSecondary mb-1.5">
                Auto Cashout (Multiplicador Alvo)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="1.01"
                  disabled={gameState === "RUNNING"}
                  value={autoCashout}
                  onChange={(e) => setAutoCashout(e.target.value)}
                  placeholder="ex: 2.00"
                  className="w-full px-3 py-2.5 bg-brand-darkest border border-brand-border rounded-xl text-sm font-bold text-white focus:outline-none focus:border-brand-accent disabled:opacity-50"
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-brand-textMuted">x</span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          {gameState === "RUNNING" ? (
            <button
              onClick={() => handleCashout()}
              className="w-full py-4 bg-brand-accent text-brand-darkest font-black text-base rounded-2xl hover:bg-brand-accentHover transition-all shadow-glow flex flex-col items-center justify-center leading-tight animate-bounce"
            >
              <span>FAZER CASHOUT</span>
              <span className="text-xs font-extrabold text-brand-darkest/90">
                {formatCurrency(betAmount * currentMultiplier)} ({currentMultiplier.toFixed(2)}x)
              </span>
            </button>
          ) : (
            <button
              onClick={handleStartBet}
              className="w-full py-4 bg-brand-accent text-brand-darkest font-black text-base rounded-2xl hover:bg-brand-accentHover transition-all shadow-glow"
            >
              APOSTAR VIRTUAL ({formatCurrency(betAmount)})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
