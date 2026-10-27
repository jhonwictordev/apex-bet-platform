"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { HeroShowcase } from "@/components/home/HeroShowcase";
import { LiveScoreCard } from "@/components/sports/LiveScoreCard";
import { CasinoGameCard } from "@/components/casino/CasinoGameCard";
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
  Database,
} from "lucide-react";

export default function HomePage() {
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
      desc: "Multiplicador ascendente em tempo real. Faça o cashout estratégico antes do foguete colidir!",
      badge: "HOT",
      icon: Zap,
      accentColor: "from-rose-500/20 via-orange-500/10 to-transparent border-rose-500/30",
      multiplier: "Até 100.000x",
    },
    {
      slug: "apex-mines",
      title: "Apex Mines",
      desc: "Grade tática 5x5. Revele joias e desvie das minas para acumular multiplicadores exponenciais.",
      badge: "POPULAR",
      icon: Sparkles,
      accentColor: "from-blue-500/20 via-cyan-500/10 to-transparent border-cyan-500/30",
      multiplier: "Customizável",
    },
    {
      slug: "apex-plinko",
      title: "Apex Plinko",
      desc: "Física balística realista com pirâmides de pinos e coeficientes extremos de até 1.000x nas bordas.",
      badge: "99% RTP",
      icon: Layers,
      accentColor: "from-emerald-500/20 via-teal-500/10 to-transparent border-emerald-500/30",
      multiplier: "1.000x Max",
    },
    {
      slug: "apex-roulette",
      title: "Roleta Royale",
      desc: "Mesa Europeia clássica de 37 caçapas (0-36) com animação de giro e tapete completo de apostas.",
      badge: "VIP",
      icon: Flame,
      accentColor: "from-amber-500/20 via-yellow-500/10 to-transparent border-amber-500/30",
      multiplier: "36x Direto",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Cinematic Dark-Luxury Hero */}
      <HeroShowcase />

      {/* Live Sports Matches Strip */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <h2 className="text-lg font-black text-white flex items-center gap-2 font-display">
              Confrontos Esportivos Ao Vivo
            </h2>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-red-950/80 border border-red-800 text-red-400">
              Tempo Real
            </span>
          </div>

          <Link
            href="/esportes?live=true"
            className="text-xs font-bold text-brand-accent hover:underline flex items-center gap-1 group"
          >
            Ver todos ({liveEvents.length})
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {liveEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {liveEvents.slice(0, 3).map((event) => (
              <LiveScoreCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-brand-surface border border-brand-border text-center text-xs text-brand-textMuted">
            Nenhuma partida ao vivo no momento. Sincronize novos dados ou consulte a programação de partidas futuras no Sportsbook.
          </div>
        )}
      </section>

      {/* In-House Apex Originals Showcase */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-brand-accent/20 border border-brand-accent/40 flex items-center justify-center text-brand-accent">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-lg font-black text-white font-display">
              Apex Originals • Jogos Próprios
            </h2>
          </div>
          <span className="text-xs text-brand-textMuted font-semibold hidden sm:inline">
            Algoritmos Provably Fair & RNG Certificável
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {originals.map((game) => {
            const Icon = game.icon;

            return (
              <Link
                key={game.slug}
                href={`/cassino/originais/${game.slug}`}
                className={`group relative bg-brand-surface/90 hover:bg-brand-surface border rounded-2xl p-5 space-y-3.5 transition-all duration-200 hover:-translate-y-1 shadow-card hover:shadow-cardHover bg-gradient-to-br ${game.accentColor}`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-brand-darkest/90 border border-brand-border flex items-center justify-center text-brand-accent group-hover:shadow-glow group-hover:scale-105 transition-all">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-brand-accent/20 border border-brand-accent/40 text-brand-accent">
                    {game.badge}
                  </span>
                </div>

                <div>
                  <h3 className="font-black text-base text-white group-hover:text-brand-accent transition-colors font-display">
                    {game.title}
                  </h3>
                  <p className="text-xs text-brand-textSecondary line-clamp-2 mt-1 leading-relaxed">
                    {game.desc}
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-brand-border/40 text-xs">
                  <span className="text-[10px] font-mono text-brand-textMuted font-bold">
                    {game.multiplier}
                  </span>
                  <span className="font-bold text-brand-accent group-hover:translate-x-1 transition-transform flex items-center gap-1 text-[11px]">
                    Jogar Demo <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Popular Casino Games Catalog */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-red-950/60 border border-red-800/80 flex items-center justify-center text-red-400">
              <Flame className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-lg font-black text-white font-display">
              Em Alta no Cassino
            </h2>
          </div>
          <Link
            href="/cassino"
            className="text-xs font-bold text-brand-accent hover:underline flex items-center gap-1 group"
          >
            Ver todos ({popularGames.length})
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
          {popularGames.slice(0, 6).map((game) => (
            <CasinoGameCard key={game.slug} game={game} />
          ))}
        </div>
      </section>

      {/* Connected Providers Strip */}
      <section className="bg-brand-surface/90 border border-brand-border rounded-2xl p-5 md:p-6 space-y-4 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2 font-display">
              <Database className="w-4 h-4 text-brand-accent" />
              Provedores B2B & Sandboxes Conectadas
            </h3>
            <p className="text-xs text-brand-textSecondary mt-0.5">
              Adaptadores independentes com suporte a callbacks de balanço e lançamento seguro de iframes demonstrativos.
            </p>
          </div>
          <Link
            href="/admin"
            className="text-xs text-brand-accent font-bold hover:underline self-start sm:self-center"
          >
            Gerenciar Conexões →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2.5">
          {providers.map((p) => (
            <div
              key={p.providerCode}
              className="bg-brand-card/90 border border-brand-border/70 rounded-xl p-2.5 text-center space-y-1 hover:border-brand-accent/40 transition-colors"
            >
              <span className="font-bold text-xs text-white block truncate">{p.name}</span>
              <span
                className={`inline-block px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
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
