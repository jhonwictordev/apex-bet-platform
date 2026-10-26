"use client";

import React, { useEffect, useState } from "react";
import { useBetSlip } from "@/context/bet-slip-context";
import { Trophy, Activity, Calendar, ShieldCheck, ChevronRight } from "lucide-react";

export default function SportsbookPage() {
  const { addSelection, selections } = useBetSlip();

  const [sports, setSports] = useState<any[]>([]);
  const [selectedSport, setSelectedSport] = useState<string>("all");
  const [liveOnly, setLiveOnly] = useState<boolean | null>(null);
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFixtures() {
      try {
        const liveParam = liveOnly === true ? "&live=true" : liveOnly === false ? "&live=false" : "";
        const res = await fetch(`/api/sports/fixtures?sport=${selectedSport}${liveParam}`);
        if (res.ok) {
          const json = await res.json();
          setFixtures(json.data || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    loadFixtures();
  }, [selectedSport, liveOnly]);

  const sportsTabs = [
    { slug: "all", name: "Todos", icon: "🌐" },
    { slug: "futebol", name: "Futebol", icon: "⚽" },
    { slug: "basquete", name: "Basquete", icon: "🏀" },
    { slug: "tenis", name: "Tênis", icon: "🎾" },
    { slug: "esports", name: "E-Sports", icon: "🎮" },
    { slug: "mma", name: "MMA / UFC", icon: "🥊" },
  ];

  return (
    <div className="space-y-6">
      {/* Sportsbook Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-2">
            <Trophy className="w-7 h-7 text-brand-accent" />
            Apostas Esportivas Demonstrativas
          </h1>
          <p className="text-xs text-brand-textSecondary mt-1">
            Partidas simuladas ao vivo e pré-jogo com mercados reais (1X2, Over/Under, BTTS) e odds dinâmicas fictícias.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setLiveOnly(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              liveOnly === null
                ? "bg-brand-accent text-brand-darkest shadow-glow"
                : "bg-brand-surface border border-brand-border text-brand-textSecondary hover:text-white"
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setLiveOnly(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              liveOnly === true
                ? "bg-red-600 text-white shadow-glow"
                : "bg-brand-surface border border-brand-border text-brand-textSecondary hover:text-white"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
            Ao Vivo
          </button>
          <button
            onClick={() => setLiveOnly(false)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              liveOnly === false
                ? "bg-brand-accent text-brand-darkest shadow-glow"
                : "bg-brand-surface border border-brand-border text-brand-textSecondary hover:text-white"
            }`}
          >
            Próximos
          </button>
        </div>
      </div>

      {/* Sports Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-brand-border">
        {sportsTabs.map((s) => (
          <button
            key={s.slug}
            onClick={() => setSelectedSport(s.slug)}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              selectedSport === s.slug
                ? "bg-brand-card text-brand-accent border border-brand-accent/50 shadow-glowSm"
                : "bg-brand-surface border border-brand-border text-brand-textSecondary hover:text-white"
            }`}
          >
            <span>{s.icon}</span>
            <span>{s.name}</span>
          </button>
        ))}
      </div>

      {/* Fixtures List */}
      {loading ? (
        <div className="py-20 text-center text-brand-textMuted">Carregando eventos esportivos...</div>
      ) : fixtures.length === 0 ? (
        <div className="py-20 text-center text-brand-textMuted bg-brand-surface border border-brand-border rounded-2xl">
          Nenhum evento encontrado para esta modalidade.
        </div>
      ) : (
        <div className="space-y-4">
          {fixtures.map((event) => {
            const mainMarket = event.markets?.[0];

            return (
              <div
                key={event.id}
                className="bg-brand-surface border border-brand-border rounded-2xl p-4 md:p-5 hover:border-brand-border/90 transition-all shadow-md space-y-4"
              >
                {/* Competition Bar */}
                <div className="flex items-center justify-between text-xs text-brand-textMuted border-b border-brand-border/40 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-white">{event.sport?.name}</span>
                    <span>•</span>
                    <span className="text-brand-textSecondary">{event.competition?.name}</span>
                  </div>

                  {event.isLive ? (
                    <span className="px-2 py-0.5 rounded bg-red-950/80 border border-red-800 text-red-400 font-extrabold flex items-center gap-1.5 text-[10px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      {event.currentPeriod} {event.currentMinute ? `${event.currentMinute}'` : ""}
                    </span>
                  ) : (
                    <span className="text-brand-textMuted text-[11px] flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(event.startTime).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>

                {/* Match Teams and Scores */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                  <div className="lg:col-span-5 space-y-2">
                    <div className="flex items-center justify-between font-bold text-sm">
                      <span className="text-white">{event.homeTeam}</span>
                      <span className="text-brand-accent font-black text-lg">{event.homeScore}</span>
                    </div>
                    <div className="flex items-center justify-between font-bold text-sm">
                      <span className="text-white">{event.awayTeam}</span>
                      <span className="text-brand-accent font-black text-lg">{event.awayScore}</span>
                    </div>
                  </div>

                  {/* Market Odds Buttons */}
                  <div className="lg:col-span-7">
                    {mainMarket && (
                      <div className="space-y-1">
                        <span className="text-[10px] text-brand-textMuted uppercase font-bold block">
                          {mainMarket.name}
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {mainMarket.odds?.map((odd: any) => {
                            const isSelected = selections.some((s) => s.oddId === odd.id);

                            return (
                              <button
                                key={odd.id}
                                onClick={() =>
                                  addSelection({
                                    eventId: event.id,
                                    eventName: `${event.homeTeam} x ${event.awayTeam}`,
                                    marketId: mainMarket.id,
                                    marketName: mainMarket.name,
                                    oddId: odd.id,
                                    selectionLabel: odd.label,
                                    oddValue: odd.value,
                                  })
                                }
                                className={`p-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-between gap-2 ${
                                  isSelected
                                    ? "bg-brand-accent text-brand-darkest border-brand-accent shadow-glow"
                                    : "bg-brand-card hover:bg-brand-cardHover border-brand-border text-brand-textSecondary hover:text-white"
                                }`}
                              >
                                <span className="truncate text-left text-[11px]">{odd.label}</span>
                                <span
                                  className={`font-black text-xs ${
                                    isSelected ? "text-brand-darkest" : "text-brand-accent"
                                  }`}
                                >
                                  {odd.value.toFixed(2)}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
