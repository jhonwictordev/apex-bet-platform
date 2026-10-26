"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useBetSlip } from "@/context/bet-slip-context";
import { ArrowLeft, Trophy, Calendar, Activity, ShieldCheck, Flame, Database } from "lucide-react";

export default function MatchDetailPage() {
  const { id } = useParams() as { id: string };
  const { addSelection, selections } = useBetSlip();

  const [event, setEvent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvent() {
      try {
        const res = await fetch(`/api/sports/fixtures`);
        if (res.ok) {
          const json = await res.json();
          const found = (json.data || []).find((ev: any) => ev.id === id);
          setEvent(found || null);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadEvent();
    }
  }, [id]);

  if (loading) {
    return <div className="py-20 text-center text-brand-textMuted">Carregando detalhes do confronto...</div>;
  }

  if (!event) {
    return (
      <div className="py-20 text-center text-brand-textMuted bg-brand-surface border border-brand-border rounded-2xl">
        Evento não encontrado.
      </div>
    );
  }

  const getSourceBadge = (source?: string) => {
    switch (source) {
      case "THESPORTSDB":
        return {
          label: "Fonte: TheSportsDB (Chave Pública 123)",
          className: "bg-emerald-950/80 border-emerald-800 text-emerald-400",
          dotColor: "bg-emerald-400",
        };
      case "OPENLIGADB":
        return {
          label: "Fonte: OpenLigaDB (Oficial Alemanha/Europa)",
          className: "bg-blue-950/80 border-blue-800 text-blue-400",
          dotColor: "bg-blue-400",
        };
      case "API_SPORTS":
        return {
          label: "Fonte: API-SPORTS (Tempo Real)",
          className: "bg-purple-950/80 border-purple-800 text-purple-400",
          dotColor: "bg-purple-400",
        };
      default:
        return {
          label: "Fonte: Gateway Esportivo",
          className: "bg-zinc-800 border-zinc-700 text-zinc-300",
          dotColor: "bg-zinc-400",
        };
    }
  };

  const sourceBadge = getSourceBadge(event.externalSource);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back button */}
      <Link
        href="/esportes"
        className="inline-flex items-center gap-2 text-xs font-bold text-brand-textSecondary hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar ao Sportsbook
      </Link>

      {/* Match Scoreboard Banner */}
      <div className="bg-brand-surface border border-brand-border rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-brand-textMuted border-b border-brand-border/40 pb-3">
          <div className="flex items-center gap-2 font-bold text-white">
            <span className="text-brand-accent">{event.sport?.name || "Futebol"}</span>
            <span>•</span>
            <span className="text-brand-textSecondary">{event.competition?.name}</span>
            <span className="text-brand-textMuted">({event.competition?.country || "Oficial"})</span>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded border text-[10px] font-bold flex items-center gap-1.5 ${sourceBadge.className}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${sourceBadge.dotColor}`} />
              {sourceBadge.label}
            </span>

            {event.isLive ? (
              <span className="px-3 py-1 rounded-full bg-red-950/80 border border-red-800 text-red-400 font-black flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                AO VIVO {event.currentPeriod ? `• ${event.currentPeriod}` : ""} {event.currentMinute ? `${event.currentMinute}'` : ""}
              </span>
            ) : (
              <span className="text-xs text-brand-textMuted flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-brand-accent" />
                {new Date(event.startTime).toLocaleString("pt-BR")}
              </span>
            )}
          </div>
        </div>

        {/* Score & Teams with Escudos */}
        <div className="grid grid-cols-3 items-center text-center py-2">
          {/* Home Team */}
          <div className="flex flex-col items-center space-y-2">
            {event.homeLogo ? (
              <img
                src={event.homeLogo}
                alt={event.homeTeam}
                className="w-16 h-16 md:w-20 md:h-20 object-contain rounded-2xl bg-white/5 p-2 border border-brand-border shadow-md"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-brand-card border border-brand-border flex items-center justify-center text-lg text-brand-accent font-black">
                {event.homeTeam.slice(0, 2).toUpperCase()}
              </div>
            )}
            <h2 className="text-base md:text-2xl font-black text-white">{event.homeTeam}</h2>
            <span className="text-[11px] text-brand-textMuted font-bold">Mandante</span>
          </div>

          {/* Placar Central */}
          <div className="flex flex-col items-center">
            <div className="text-4xl md:text-7xl font-black text-brand-accent tracking-tight shadow-glowSm">
              {event.homeScore} : {event.awayScore}
            </div>
            {event.isLive ? (
              <span className="text-xs font-bold text-red-400 mt-2 px-3 py-0.5 rounded-full bg-red-950/80 border border-red-800 animate-pulse">
                Em Andamento ({event.currentMinute || 70}&apos;)
              </span>
            ) : (
              <span className="text-xs font-bold text-brand-textSecondary mt-2">
                {event.status === "FINISHED" ? "Partida Encerrada" : "Início Programado"}
              </span>
            )}
            {event.lastSyncedAt && (
              <span className="text-[10px] text-brand-textMuted mt-1">
                Última sync: {new Date(event.lastSyncedAt).toLocaleTimeString("pt-BR")}
              </span>
            )}
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center space-y-2">
            {event.awayLogo ? (
              <img
                src={event.awayLogo}
                alt={event.awayTeam}
                className="w-16 h-16 md:w-20 md:h-20 object-contain rounded-2xl bg-white/5 p-2 border border-brand-border shadow-md"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-brand-card border border-brand-border flex items-center justify-center text-lg text-brand-accent font-black">
                {event.awayTeam.slice(0, 2).toUpperCase()}
              </div>
            )}
            <h2 className="text-base md:text-2xl font-black text-white">{event.awayTeam}</h2>
            <span className="text-[11px] text-brand-textMuted font-bold">Visitante</span>
          </div>
        </div>

        {/* Live Pitch Simulator Radar */}
        <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-2xl p-4 space-y-3">
          <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" /> Estatísticas do Confronto
          </span>

          <div className="space-y-2 text-xs">
            <div>
              <div className="flex justify-between font-bold text-white mb-1">
                <span>54%</span>
                <span className="text-brand-textMuted text-[11px]">Posse de Bola</span>
                <span>46%</span>
              </div>
              <div className="h-2 w-full bg-brand-darkest rounded-full overflow-hidden flex">
                <div className="bg-brand-accent h-full" style={{ width: "54%" }} />
                <div className="bg-emerald-700 h-full" style={{ width: "46%" }} />
              </div>
            </div>

            <div className="grid grid-cols-3 text-center text-xs pt-1 border-t border-emerald-900/40">
              <div>
                <span className="font-extrabold text-white">6</span>
                <span className="text-[10px] text-brand-textMuted block">Finalizações no Alvo</span>
              </div>
              <div>
                <span className="font-extrabold text-white">5</span>
                <span className="text-[10px] text-brand-textMuted block">Escanteios</span>
              </div>
              <div>
                <span className="font-extrabold text-white">4</span>
                <span className="text-[10px] text-brand-textMuted block">Finalizações no Alvo</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Markets Board */}
      <div className="space-y-4">
        <h3 className="font-extrabold text-lg text-white">Mercados de Apostas Disponíveis</h3>

        <div className="space-y-4">
          {event.markets?.map((market: any) => (
            <div key={market.id} className="bg-brand-surface border border-brand-border rounded-2xl p-5 space-y-3 shadow-lg">
              <div className="flex items-center justify-between border-b border-brand-border/40 pb-2">
                <span className="font-extrabold text-sm text-white">{market.name}</span>
                <span className="text-[10px] font-bold text-brand-accent uppercase">Ativo</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {market.odds?.map((odd: any) => {
                  const isSelected = selections.some((s) => s.oddId === odd.id);

                  return (
                    <button
                      key={odd.id}
                      onClick={() =>
                        addSelection({
                          eventId: event.id,
                          eventName: `${event.homeTeam} x ${event.awayTeam}`,
                          marketId: market.id,
                          marketName: market.name,
                          oddId: odd.id,
                          selectionLabel: odd.label,
                          oddValue: odd.value,
                        })
                      }
                      className={`p-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-between gap-2 ${
                        isSelected
                          ? "bg-brand-accent text-brand-darkest border-brand-accent shadow-glow"
                          : "bg-brand-card hover:bg-brand-cardHover border-brand-border text-brand-textSecondary hover:text-white"
                      }`}
                    >
                      <span className="truncate">{odd.label}</span>
                      <span
                        className={`font-black text-sm ${
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
          ))}
        </div>
      </div>
    </div>
  );
}
