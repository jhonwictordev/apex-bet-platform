"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, Gamepad2, Trophy, Coins, ShieldCheck, Zap, Activity } from "lucide-react";
import { useAuth } from "@/context/auth-context";

export function HeroShowcase() {
  const { user, refillFaucet } = useAuth();

  return (
    <section className="relative rounded-3xl overflow-hidden border border-brand-border bg-gradient-to-br from-brand-card via-brand-surface to-brand-darkest p-6 sm:p-8 md:p-12 shadow-2xl">
      {/* Ambient Radial Glows */}
      <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 bg-brand-accent/12 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 bg-brand-accentSecondary/10 rounded-full blur-[80px] pointer-events-none" />

      {/* Decorative Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative z-10 max-w-3xl space-y-5">
        {/* Editorial Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-accent/10 border border-brand-accent/30 text-brand-accent text-xs font-bold tracking-wide shadow-glowSm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Plataforma Demonstrativa Premium • Créditos Fictícios</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1] font-display">
          A Experiência Definitiva em{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-brand-accentSecondary">
            Apostas & Cassino
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-brand-textSecondary text-sm sm:text-base leading-relaxed max-w-2xl">
          Inspirada no padrão visual dos líderes da indústria (Stake, 1win e Bet365).
          Dados esportivos reais sincronizados via TheSportsDB e OpenLigaDB, jogos originais com motor RNG auditável e sistema completo de apostas simuladas.
        </p>

        {/* Action CTAs */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Link
            href="/cassino"
            className="px-6 py-3.5 rounded-xl bg-brand-accent text-brand-darkest font-black text-sm hover:bg-brand-accentHover transition-all shadow-glow flex items-center gap-2 group active:scale-[0.98]"
          >
            <Gamepad2 className="w-4 h-4 text-brand-darkest group-hover:rotate-12 transition-transform" />
            Explorar Cassino
          </Link>

          <Link
            href="/esportes"
            className="px-6 py-3.5 rounded-xl bg-brand-card hover:bg-brand-cardHover border border-brand-border text-white font-bold text-sm transition-all flex items-center gap-2 active:scale-[0.98]"
          >
            <Trophy className="w-4 h-4 text-brand-accent" />
            Sportsbook Ao Vivo
          </Link>

          {user && (
            <button
              onClick={() => refillFaucet()}
              className="px-5 py-3.5 rounded-xl bg-brand-surfaceElevated hover:bg-brand-surfaceHighlight border border-brand-accent/40 text-brand-accent font-bold text-sm transition-all flex items-center gap-2 shadow-sm active:scale-[0.98]"
            >
              <Coins className="w-4 h-4 text-brand-accent" />
              Recarregar R$ 10.000 Fictícios
            </button>
          )}
        </div>

        {/* Live Feature Highlights Pill Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-brand-border/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-800/80 flex items-center justify-center text-emerald-400 shrink-0">
              <Activity className="w-4 h-4" />
            </div>
            <div className="leading-tight">
              <span className="text-xs font-black text-white block">3 Fontes Esportivas</span>
              <span className="text-[10px] text-brand-textMuted">TheSportsDB, OpenLigaDB, API-Sports</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-950/60 border border-purple-800/80 flex items-center justify-center text-purple-400 shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div className="leading-tight">
              <span className="text-xs font-black text-white block">6 Apex Originals</span>
              <span className="text-[10px] text-brand-textMuted">Crash, Mines, Plinko, Roleta</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-card border border-brand-border flex items-center justify-center text-brand-accent shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="leading-tight">
              <span className="text-xs font-black text-white block">100% Demonstrativo</span>
              <span className="text-[10px] text-brand-textMuted">Sem depósitos ou dinheiro real</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
