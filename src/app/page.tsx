"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useBetSlip } from "@/context/bet-slip-context";
import { useAuth } from "@/context/auth-context";
import {
  Sparkles,
  Zap,
  Activity,
  Flame,
  ArrowRight,
  ShieldCheck,
  Gamepad2,
  Trophy,
  Coins,
  ChevronRight,
  Layers,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function HomePage() {
  const { addSelection, selections } = useBetSlip();
  const { user, refillFaucet } = useAuth();

  const [liveEvents, setLiveEvents] = useState<any[]>([]);
  const [popularGames, setPopularGames] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [eventsRes, gamesRes, providersRes] = await Promise.all([
          fetch("/api/sports/fixtures?live=true"),
          fetch("/api/casino/games?featured=true"),
          fetch("/api/providers"),
        ]);

        if (eventsRes.ok) {
          const json = await eventsRes.json();
          setLiveEvents(json.data || []);
        }

        if (gamesRes.ok) {
          const json = await gamesRes.json();
          setPopularGames(json.data || []);
        }

        if (providersRes.ok) {
          const json = await providersRes.json();
          setProviders(json.data || []);
        }
      } catch (e) {
        console.error("Failed to load home data", e);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const originals = [
    {
      slug: "apex-crash",
      title: "Apex Crash",
      desc: "Multiplicador crescente em tempo real. Faça o cashout antes do foguete explodir!",
      badge: "HOT",
      icon: Zap,
      gradient: "from-red-500/20 to-orange-500/10 border-orange-500/30",
    },
    {
      slug: "apex-mines",
      title: "Apex Mines",
      desc: "Campo minado 5x5. Encontre os diamantes e escape das bombas para multiplicar seu saldo.",
      badge: "POPULAR",
      icon: Sparkles,
      gradient: "from-blue-500/20 to-cyan-500/10 border-cyan-500/30",
    },
    {
      slug: "apex-plinko",
      title: "Apex Plinko",
      desc: "Solte a bola pelos pinos e atinja os multiplicadores extremos de até 1.000x nas bordas.",
      badge: "ALTO RTP",
      icon: Layers,
      gradient: "from-green-500/20 to-emerald-500/10 border-emerald-500/30",
    },
    {
      slug: "apex-roulette",
      title: "Roulette Royale",
      desc: "Roleta Europeia 0-36 autêntica. Apostas internas e externas com rotação animada.",
      badge: "CLÁSSICO",
      icon: Flame,
      gradient: "from-purple-500/20 to-pink-500/10 border-purple-500/30",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Dynamic Hero Banner */}
      <section className="relative rounded-3xl overflow-hidden border border-brand-border bg-gradient-to-r from-brand-card via-brand-surface to-brand-darkest p-6 md:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-brand-accent/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-accent/10 border border-brand-accent/30 text-brand-accent text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Plataforma Demonstrativa Premium</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
            A Experiência Definitiva em <span className="text-brand-accent">Apostas & Cassino</span>
          </h1>

          <p className="text-brand-textSecondary text-sm md:text-base leading-relaxed">
            Inspirada nos gigantes do setor (Stake, 1win, Bet365). Motor de apostas virtuais, jogos originais demonstrativos com RNG auditável e gateway de provedores B2B integrado.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/cassino"
              className="px-6 py-3 rounded-xl bg-brand-accent text-brand-darkest font-black text-sm hover:bg-brand-accentHover transition-all shadow-glow flex items-center gap-2"
            >
              <Gamepad2 className="w-4 h-4" />
              Explorar Cassino
            </Link>
            <Link
              href="/esportes"
              className="px-6 py-3 rounded-xl bg-brand-card hover:bg-brand-cardHover border border-brand-border text-white font-bold text-sm transition-all flex items-center gap-2"
            >
              <Trophy className="w-4 h-4 text-brand-accent" />
              Apostas Esportivas
            </Link>
            {user && (
              <button
                onClick={() => refillFaucet()}
                className="px-4 py-3 rounded-xl bg-brand-darkest hover:bg-brand-surface border border-brand-accent/40 text-brand-accent font-bold text-sm transition-all flex items-center gap-2"
              >
                <Coins className="w-4 h-4" />
                Recarregar R$ 10.000 Fictícios
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Live Sports Ticker Carousel */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              Eventos Esportivos Ao Vivo
            </h2>
          </div>
          <Link
            href="/esportes"
            className="text-xs font-bold text-brand-accent hover:underline flex items-center gap-1"
          >
            Ver todos ({liveEvents.length}) <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {liveEvents.slice(0, 3).map((event) => {
            const matchWinnerMarket = event.markets?.find((m: any) => m.key === "1X2" || m.key === "MATCH_WINNER" || m.key === "MONEYLINE");
            return (
              <div
                key={event.id}
                className="bg-brand-surface border border-brand-border rounded-2xl p-4 space-y-3 hover:border-brand-border/90 transition-all shadow-lg"
              >
                <div className="flex items-center justify-between text-xs text-brand-textMuted border-b border-brand-border/40 pb-2">
                  <span className="font-semibold text-brand-textSecondary">{event.competition?.name}</span>
                  <span className="px-2 py-0.5 rounded bg-red-950/80 border border-red-800 text-red-400 font-extrabold flex items-center gap-1 text-[10px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    {event.currentPeriod} {event.currentMinute ? `${event.currentMinute}'` : ""}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm font-bold">
                    <span className="text-white">{event.homeTeam}</span>
                    <span className="text-brand-accent font-black text-base">{event.homeScore}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-bold">
                    <span className="text-white">{event.awayTeam}</span>
                    <span className="text-brand-accent font-black text-base">{event.awayScore}</span>
                  </div>
                </div>

                {/* 1X2 Quick Odds Buttons */}
                {matchWinnerMarket && (
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    {matchWinnerMarket.odds?.map((odd: any) => {
                      const isSelected = selections.some((s) => s.oddId === odd.id);
                      return (
                        <button
                          key={odd.id}
                          onClick={() =>
                            addSelection({
                              eventId: event.id,
                              eventName: `${event.homeTeam} x ${event.awayTeam}`,
                              marketId: matchWinnerMarket.id,
                              marketName: matchWinnerMarket.name,
                              oddId: odd.id,
                              selectionLabel: odd.label,
                              oddValue: odd.value,
                            })
                          }
                          className={`py-2 px-1 rounded-xl text-xs font-bold transition-all border flex flex-col items-center justify-center ${
                            isSelected
                              ? "bg-brand-accent text-brand-darkest border-brand-accent shadow-glow"
                              : "bg-brand-card hover:bg-brand-cardHover border-brand-border text-brand-textSecondary hover:text-white"
                          }`}
                        >
                          <span className="text-[10px] truncate max-w-full">{odd.label}</span>
                          <span className={`text-xs font-black ${isSelected ? "text-brand-darkest" : "text-brand-accent"}`}>
                            {odd.value.toFixed(2)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* In-House Apex Originals Showcase */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-accent" />
            <h2 className="text-lg font-black text-white">Apex Originals (Jogos Próprios)</h2>
          </div>
          <span className="text-xs text-brand-textMuted font-medium">
            RNG Provably Fair no Servidor
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {originals.map((game) => {
            const Icon = game.icon;
            return (
              <Link
                key={game.slug}
                href={`/cassino/originais/${game.slug}`}
                className={`group relative bg-brand-surface border rounded-2xl p-5 space-y-3 transition-all hover:scale-[1.02] shadow-lg ${game.gradient}`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-brand-darkest border border-brand-border flex items-center justify-center text-brand-accent group-hover:shadow-glow transition-all">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-brand-accent/20 border border-brand-accent/40 text-brand-accent">
                    {game.badge}
                  </span>
                </div>

                <div>
                  <h3 className="font-black text-base text-white group-hover:text-brand-accent transition-colors">
                    {game.title}
                  </h3>
                  <p className="text-xs text-brand-textSecondary line-clamp-2 mt-1">
                    {game.desc}
                  </p>
                </div>

                <div className="pt-2 flex items-center gap-1.5 text-xs font-bold text-brand-accent group-hover:translate-x-1 transition-transform">
                  <span>Jogar Agora</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Popular Casino Games Catalog */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-brand-accent" />
            <h2 className="text-lg font-black text-white">Jogos em Alta no Cassino</h2>
          </div>
          <Link
            href="/cassino"
            className="text-xs font-bold text-brand-accent hover:underline flex items-center gap-1"
          >
            Ver catálogo completo <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {popularGames.slice(0, 6).map((game) => (
            <Link
              key={game.slug}
              href={`/cassino/${game.slug}`}
              className="group relative bg-brand-surface border border-brand-border rounded-2xl overflow-hidden hover:border-brand-accent/60 transition-all shadow-md flex flex-col"
            >
              <div className="aspect-[4/3] w-full overflow-hidden bg-brand-card relative">
                {game.thumbnail ? (
                  <img
                    src={game.thumbnail}
                    alt={game.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-brand-textMuted">
                    <Gamepad2 className="w-8 h-8" />
                  </div>
                )}
                {game.isHot && (
                  <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-black bg-red-600 text-white">
                    HOT
                  </span>
                )}
                <div className="absolute inset-0 bg-brand-darkest/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="px-3 py-1.5 rounded-lg bg-brand-accent text-brand-darkest font-black text-xs shadow-glow">
                    Jogar Demo
                  </span>
                </div>
              </div>

              <div className="p-2.5">
                <h4 className="font-bold text-xs text-white truncate">{game.title}</h4>
                <div className="flex items-center justify-between mt-1 text-[10px] text-brand-textMuted">
                  <span>{game.provider?.name}</span>
                  <span className="font-semibold text-brand-accent">{game.rtp}% RTP</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Providers Strip */}
      <section className="bg-brand-surface border border-brand-border rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-white">Provedores de Jogos Conectados</h3>
            <p className="text-xs text-brand-textSecondary">
              Arquitetura de adaptadores independentes compatível com estúdios internacionais.
            </p>
          </div>
          <Link href="/admin" className="text-xs text-brand-accent font-bold hover:underline">
            Configurar Sandboxes →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
          {providers.map((p) => (
            <div
              key={p.providerCode}
              className="bg-brand-card border border-brand-border/70 rounded-xl p-2.5 text-center space-y-1"
            >
              <span className="font-bold text-xs text-white block truncate">{p.name}</span>
              <span
                className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-semibold ${
                  p.status === "AVAILABLE_DEMO" || p.status === "CONFIGURED"
                    ? "bg-green-950/70 text-green-300 border border-green-800"
                    : "bg-yellow-950/70 text-yellow-300 border border-yellow-800"
                }`}
              >
                {p.statusLabel}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
