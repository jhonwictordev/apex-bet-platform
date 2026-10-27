"use client";

import React from "react";
import Link from "next/link";
import { Calendar, ChevronRight, Activity, Trophy, Shield } from "lucide-react";
import { OddsDisplay } from "./OddsDisplay";
import { useBetSlip } from "@/context/bet-slip-context";

export interface SportsEvent {
  id: string;
  externalId?: string;
  externalSource?: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  homeLogo?: string | null;
  awayLogo?: string | null;
  startTime: string | Date;
  status: string;
  isLive: boolean;
  currentMinute?: number | null;
  currentPeriod?: string | null;
  sport?: {
    id: string;
    slug: string;
    name: string;
  };
  competition?: {
    id: string;
    name: string;
    country?: string | null;
    emblem?: string | null;
  };
  markets?: Array<{
    id: string;
    key: string;
    name: string;
    odds: Array<{
      id: string;
      label: string;
      value: number;
    }>;
  }>;
}

interface SportsEventCardProps {
  event: SportsEvent;
  compact?: boolean;
}

export function SportsEventCard({ event, compact = false }: SportsEventCardProps) {
  const { addSelection, selections } = useBetSlip();

  const getSourceBadge = (source?: string) => {
    switch (source) {
      case "THESPORTSDB":
        return {
          label: "TheSportsDB (API Oficial)",
          className: "bg-emerald-950/60 border-emerald-800/80 text-emerald-400",
          dotColor: "bg-emerald-400",
        };
      case "OPENLIGADB":
        return {
          label: "OpenLigaDB (Alemanha/Europa)",
          className: "bg-blue-950/60 border-blue-800/80 text-blue-400",
          dotColor: "bg-blue-400",
        };
      case "API_SPORTS":
        return {
          label: "API-SPORTS (Tempo Real)",
          className: "bg-purple-950/60 border-purple-800/80 text-purple-400",
          dotColor: "bg-purple-400",
        };
      default:
        return {
          label: "Apex Sports Gateway",
          className: "bg-zinc-800/80 border-zinc-700/80 text-zinc-300",
          dotColor: "bg-zinc-400",
        };
    }
  };

  const sourceBadge = getSourceBadge(event.externalSource);
  const mainMarket = event.markets?.[0];
  const totalMarkets = event.markets?.length || 1;

  const formattedDate = new Date(event.startTime).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="group relative bg-brand-surface/90 hover:bg-brand-surface border border-brand-border hover:border-brand-accent/40 rounded-2xl p-4 md:p-5 transition-all duration-200 shadow-card hover:shadow-cardHover">
      {/* Top Header: Competition & Live/Date status */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-border/60 pb-3 mb-3.5 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-5 h-5 rounded-md bg-brand-card flex items-center justify-center text-brand-accent shrink-0 border border-brand-border">
            <Trophy className="w-3 h-3" />
          </div>
          <span className="font-extrabold text-white truncate max-w-[140px] sm:max-w-[200px]">
            {event.competition?.name || "Liga Internacional"}
          </span>
          {event.competition?.country && (
            <span className="text-[11px] text-brand-textMuted font-medium hidden sm:inline">
              ({event.competition.country})
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Source indicator pill */}
          <span
            className={`px-2 py-0.5 rounded-full border text-[10px] font-bold flex items-center gap-1.5 ${sourceBadge.className}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${sourceBadge.dotColor}`} />
            {sourceBadge.label}
          </span>

          {/* Live vs Scheduled */}
          {event.isLive ? (
            <span className="px-2.5 py-0.5 rounded-full bg-red-950/80 border border-red-800/80 text-red-400 font-extrabold flex items-center gap-1.5 text-[10px] animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              AO VIVO {event.currentPeriod ? `• ${event.currentPeriod}` : ""} {event.currentMinute ? `${event.currentMinute}'` : ""}
            </span>
          ) : (
            <span className="text-[11px] font-medium text-brand-textMuted flex items-center gap-1">
              <Calendar className="w-3 h-3 text-brand-accent" />
              {formattedDate}
            </span>
          )}
        </div>
      </div>

      {/* Main Body: Teams, Crests, Scores & Odds */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        {/* Teams & Scores Block */}
        <Link
          href={`/esportes/evento/${event.id}`}
          className="lg:col-span-5 space-y-2.5 cursor-pointer hover:opacity-90 transition-opacity"
        >
          {/* Home Team */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              {event.homeLogo ? (
                <img
                  src={event.homeLogo}
                  alt={event.homeTeam}
                  className="w-7 h-7 object-contain rounded-full bg-white/5 p-0.5 shrink-0 border border-white/10"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-brand-card border border-brand-border flex items-center justify-center text-[10px] text-brand-accent font-black shrink-0">
                  {event.homeTeam.slice(0, 2).toUpperCase()}
                </div>
              )}
              <span className="font-bold text-sm text-white group-hover:text-brand-accent transition-colors truncate">
                {event.homeTeam}
              </span>
            </div>
            <span className="font-mono tabular-nums text-lg font-black text-brand-accent shrink-0 pl-2">
              {event.homeScore}
            </span>
          </div>

          {/* Away Team */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              {event.awayLogo ? (
                <img
                  src={event.awayLogo}
                  alt={event.awayTeam}
                  className="w-7 h-7 object-contain rounded-full bg-white/5 p-0.5 shrink-0 border border-white/10"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-brand-card border border-brand-border flex items-center justify-center text-[10px] text-brand-accent font-black shrink-0">
                  {event.awayTeam.slice(0, 2).toUpperCase()}
                </div>
              )}
              <span className="font-bold text-sm text-white group-hover:text-brand-accent transition-colors truncate">
                {event.awayTeam}
              </span>
            </div>
            <span className="font-mono tabular-nums text-lg font-black text-brand-accent shrink-0 pl-2">
              {event.awayScore}
            </span>
          </div>
        </Link>

        {/* Odds & Market Buttons */}
        <div className="lg:col-span-7 space-y-2">
          {mainMarket ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-bold text-brand-textMuted uppercase tracking-wider px-1">
                <span>{mainMarket.name}</span>
                <Link
                  href={`/esportes/evento/${event.id}`}
                  className="text-brand-accent hover:underline flex items-center gap-1 font-extrabold normal-case text-[11px]"
                >
                  +{totalMarkets * 6} Mercados & Radar
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {mainMarket.odds?.map((odd) => {
                  const isSelected = selections.some((s) => s.oddId === odd.id);

                  return (
                    <OddsDisplay
                      key={odd.id}
                      label={odd.label}
                      value={odd.value}
                      isSelected={isSelected}
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
                    />
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="py-2 text-center text-xs text-brand-textMuted">
              Mercados fechados para este evento.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
