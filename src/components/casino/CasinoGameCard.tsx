"use client";

import React from "react";
import Link from "next/link";
import { Gamepad2, Sparkles, Flame, Play } from "lucide-react";

export interface CasinoGame {
  id: string;
  slug: string;
  title: string;
  category?: {
    id: string;
    slug: string;
    name: string;
  };
  provider?: {
    id: string;
    code: string;
    name: string;
  };
  thumbnail?: string | null;
  rtp?: number;
  isHot?: boolean;
  isOriginal?: boolean;
}

interface CasinoGameCardProps {
  game: CasinoGame;
}

export function CasinoGameCard({ game }: CasinoGameCardProps) {
  const isOriginal = game.isOriginal || game.provider?.code === "inhouse";
  const targetUrl = isOriginal ? `/cassino/originais/${game.slug}` : `/cassino/${game.slug}`;

  return (
    <Link
      href={targetUrl}
      className="group relative bg-brand-surface/90 hover:bg-brand-surface border border-brand-border hover:border-brand-accent/50 rounded-2xl overflow-hidden transition-all duration-300 shadow-card hover:shadow-cardHover flex flex-col hover:-translate-y-1"
    >
      {/* Thumbnail Aspect Container */}
      <div className="aspect-[4/3] w-full overflow-hidden bg-brand-card relative">
        {game.thumbnail ? (
          <img
            src={game.thumbnail}
            alt={game.title}
            className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-brand-textMuted bg-gradient-to-br from-brand-card to-brand-surface">
            <Gamepad2 className="w-9 h-9 text-brand-accent/60 mb-1" />
            <span className="text-[10px] uppercase font-bold tracking-wider text-brand-textMuted">Apex Demo</span>
          </div>
        )}

        {/* Badges in Corners */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
          {game.isHot && (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-red-600/90 text-white flex items-center gap-1 shadow-md backdrop-blur-sm">
              <Flame className="w-2.5 h-2.5" /> HOT
            </span>
          )}
          {isOriginal && (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-brand-accent text-brand-darkest flex items-center gap-1 shadow-glowSm">
              <Sparkles className="w-2.5 h-2.5" /> APEX
            </span>
          )}
        </div>

        {/* Hover Overlay with Play Button */}
        <div className="absolute inset-0 bg-brand-darkest/75 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center p-3 gap-2 z-20">
          <div className="w-11 h-11 rounded-full bg-brand-accent text-brand-darkest flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform duration-200">
            <Play className="w-5 h-5 fill-brand-darkest ml-0.5" />
          </div>
          <span className="px-3 py-1 rounded-xl bg-brand-surfaceElevated border border-white/10 text-white font-extrabold text-xs shadow-md">
            Jogar Demo
          </span>
        </div>
      </div>

      {/* Meta Footer */}
      <div className="p-3 bg-brand-surface flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-extrabold text-xs text-white group-hover:text-brand-accent transition-colors truncate">
            {game.title}
          </h3>
          <p className="text-[10px] text-brand-textMuted truncate mt-0.5">
            {game.provider?.name || "Apex Originals"}
          </p>
        </div>

        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-brand-border/40 text-[10px]">
          <span className="text-brand-textSecondary font-semibold">RTP</span>
          <span className="font-mono tabular-nums font-bold text-brand-accent">
            {game.rtp ? `${game.rtp}%` : "98.5%"}
          </span>
        </div>
      </div>
    </Link>
  );
}
