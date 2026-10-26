"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Gamepad2, Search, Filter, Sparkles, Flame } from "lucide-react";

export default function CasinoLobbyPage() {
  const [games, setGames] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedProvider, setSelectedProvider] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [gamesRes, catsRes] = await Promise.all([
          fetch(`/api/casino/games?category=${selectedCategory}&provider=${selectedProvider}&search=${searchQuery}`),
          fetch("/api/casino/categories"),
        ]);

        if (gamesRes.ok) {
          const json = await gamesRes.json();
          setGames(json.data || []);
        }

        if (catsRes.ok) {
          const json = await catsRes.json();
          setCategories(json.data || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [selectedCategory, selectedProvider, searchQuery]);

  const providers = [
    { code: "all", name: "Todos os Provedores" },
    { code: "inhouse", name: "Apex Originals" },
    { code: "pragmatic", name: "Pragmatic Play" },
    { code: "pgsoft", name: "PG Soft" },
    { code: "spribe", name: "Spribe" },
    { code: "evolution", name: "Evolution Gaming" },
    { code: "bgaming", name: "BGaming" },
    { code: "netent", name: "NetEnt" },
    { code: "playtech", name: "Playtech" },
  ];

  return (
    <div className="space-y-6">
      {/* Lobby Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-2">
            <Gamepad2 className="w-7 h-7 text-brand-accent" />
            Lobby de Cassino Demonstrativo
          </h1>
          <p className="text-xs text-brand-textSecondary mt-1">
            Mais de 30 títulos originais e de provedores internacionais operando em modo de teste e demonstração.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-brand-textMuted absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome do jogo..."
            className="w-full pl-9 pr-3 py-2 bg-brand-surface border border-brand-border rounded-xl text-xs text-white placeholder-brand-textMuted focus:outline-none focus:border-brand-accent"
          />
        </div>
      </div>

      {/* Categories & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-border pb-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === "all"
                ? "bg-brand-accent text-brand-darkest shadow-glow"
                : "bg-brand-surface border border-brand-border text-brand-textSecondary hover:text-white"
            }`}
          >
            Todos os Jogos
          </button>
          {categories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => setSelectedCategory(cat.slug)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat.slug
                  ? "bg-brand-accent text-brand-darkest shadow-glow"
                  : "bg-brand-surface border border-brand-border text-brand-textSecondary hover:text-white"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Provider Dropdown */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-brand-textMuted" />
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="px-3 py-1.5 bg-brand-surface border border-brand-border rounded-xl text-xs font-bold text-white focus:outline-none focus:border-brand-accent"
          >
            {providers.map((p) => (
              <option key={p.code} value={p.code}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Games Grid */}
      {loading ? (
        <div className="py-20 text-center text-brand-textMuted">Carregando catálogo...</div>
      ) : games.length === 0 ? (
        <div className="py-20 text-center text-brand-textMuted bg-brand-surface border border-brand-border rounded-2xl">
          Nenhum jogo encontrado com os filtros selecionados.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {games.map((game) => {
            const isOriginal = game.isOriginal || game.provider?.code === "inhouse";
            const targetUrl = isOriginal ? `/cassino/originais/${game.slug}` : `/cassino/${game.slug}`;

            return (
              <Link
                key={game.slug}
                href={targetUrl}
                className="group relative bg-brand-surface border border-brand-border rounded-2xl overflow-hidden hover:border-brand-accent/60 transition-all shadow-md flex flex-col hover:scale-[1.02]"
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
                    <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-black bg-red-600 text-white flex items-center gap-0.5">
                      <Flame className="w-2.5 h-2.5" /> HOT
                    </span>
                  )}

                  {isOriginal && (
                    <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-black bg-brand-accent text-brand-darkest flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" /> APEX
                    </span>
                  )}

                  <div className="absolute inset-0 bg-brand-darkest/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="px-3.5 py-1.5 rounded-xl bg-brand-accent text-brand-darkest font-black text-xs shadow-glow">
                      Jogar Demo
                    </span>
                  </div>
                </div>

                <div className="p-3">
                  <h3 className="font-bold text-xs text-white truncate">{game.title}</h3>
                  <div className="flex items-center justify-between mt-1 text-[10px] text-brand-textMuted">
                    <span>{game.provider?.name}</span>
                    <span className="font-semibold text-brand-accent">{game.rtp}% RTP</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
