"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useBetSlip } from "@/context/bet-slip-context";
import { formatOdds } from "@/lib/utils";

interface LiveScoreCardProps {
  event: any;
}

export function LiveScoreCard({ event }: LiveScoreCardProps) {
  const { addSelection, selections } = useBetSlip();

  const matchWinnerMarket = event.markets?.find(
    (m: any) => m.key === "1X2" || m.key === "MATCH_WINNER" || m.key === "MONEYLINE"
  ) || event.markets?.[0];

  return (
    <div className="bg-brand-surface/95 border border-brand-border hover:border-brand-accent/50 rounded-2xl p-3.5 space-y-3 transition-all duration-200 shadow-card flex flex-col justify-between">
      {/* Top Header: Competition & Minute */}
      <div className="flex items-center justify-between text-xs border-b border-brand-border/40 pb-2">
        <span className="font-bold text-white truncate max-w-[150px]">
          {event.competition?.name || "Partida Ao Vivo"}
        </span>
        <span className="px-2 py-0.5 rounded-full bg-red-950/80 border border-red-800 text-red-400 font-extrabold flex items-center gap-1.5 text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          {event.currentPeriod || "1T"} {event.currentMinute ? `${event.currentMinute}'` : ""}
        </span>
      </div>

      {/* Teams & Scores */}
      <Link
        href={`/esportes/evento/${event.id}`}
        className="space-y-1.5 group cursor-pointer"
      >
        <div className="flex items-center justify-between font-bold text-xs">
          <div className="flex items-center gap-2 min-w-0">
            {event.homeLogo ? (
              <img
                src={event.homeLogo}
                alt={event.homeTeam}
                className="w-5 h-5 object-contain rounded-full bg-white/5 p-0.5 shrink-0"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-brand-card flex items-center justify-center text-[9px] text-brand-accent font-black shrink-0">
                {event.homeTeam.slice(0, 2).toUpperCase()}
              </div>
            )}
            <span className="text-white group-hover:text-brand-accent transition-colors truncate">
              {event.homeTeam}
            </span>
          </div>
          <span className="font-mono tabular-nums text-brand-accent font-black text-sm pl-2">
            {event.homeScore}
          </span>
        </div>

        <div className="flex items-center justify-between font-bold text-xs">
          <div className="flex items-center gap-2 min-w-0">
            {event.awayLogo ? (
              <img
                src={event.awayLogo}
                alt={event.awayTeam}
                className="w-5 h-5 object-contain rounded-full bg-white/5 p-0.5 shrink-0"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-brand-card flex items-center justify-center text-[9px] text-brand-accent font-black shrink-0">
                {event.awayTeam.slice(0, 2).toUpperCase()}
              </div>
            )}
            <span className="text-white group-hover:text-brand-accent transition-colors truncate">
              {event.awayTeam}
            </span>
          </div>
          <span className="font-mono tabular-nums text-brand-accent font-black text-sm pl-2">
            {event.awayScore}
          </span>
        </div>
      </Link>

      {/* Odds Row */}
      {matchWinnerMarket && (
        <div className="grid grid-cols-3 gap-1 pt-1 border-t border-brand-border/40">
          {matchWinnerMarket.odds?.slice(0, 3).map((odd: any) => {
            const isSelected = selections.some((s) => s.oddId === odd.id);

            return (
              <button
                key={odd.id}
                onClick={(e) => {
                  e.stopPropagation();
                  addSelection({
                    eventId: event.id,
                    eventName: `${event.homeTeam} x ${event.awayTeam}`,
                    marketId: matchWinnerMarket.id,
                    marketName: matchWinnerMarket.name,
                    oddId: odd.id,
                    selectionLabel: odd.label,
                    oddValue: odd.value,
                  });
                }}
                className={`py-1.5 px-1 rounded-lg text-center transition-all flex flex-col items-center justify-center border ${
                  isSelected
                    ? "bg-brand-accent text-brand-darkest border-brand-accent shadow-glowSm"
                    : "bg-brand-card hover:bg-brand-cardHover border-brand-border text-brand-textSecondary hover:text-white"
                }`}
              >
                <span className="text-[9px] font-semibold truncate max-w-full">
                  {odd.label}
                </span>
                <span
                  className={`text-[11px] font-black font-mono tabular-nums ${
                    isSelected ? "text-brand-darkest" : "text-brand-accent"
                  }`}
                >
                  {formatOdds(odd.value)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
