"use client";

import React, { useEffect, useState } from "react";
import { CasinoGameCard } from "@/components/casino/CasinoGameCard";
import { Gamepad2, Search, Filter, Sparkles, Flame, RefreshCw } from "lucide-react";

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
          fetch(`/api/casino/games?category=${selectedCategory}&provider=${selectedProvider}&search=${encodeURIComponent(searchQuery)}`),
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

    const timer = setTimeout(() => {
      loadData();
    }, 150);

    return () => clearTimeout(timer);
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
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Lobby Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-2.5 font-display">
            <Gamepad2 className="w-7 h-7 text-brand-accent" />
            Lobby de Cassino Demonstrativo
          </h1>
          <p className="text-xs text-brand-textSecondary mt-1">
            Mais de 30 títulos com RNG auditável e estúdios internacionais conectados operando exclusivamente em modo de demonstração.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-brand-textMuted absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por título ou estúdio..."
            className="w-full pl-10 pr-4 py-2 bg-brand-surface border border-brand-border rounded-xl text-xs text-white placeholder-brand-textMuted focus:outline-none focus:border-brand-accent transition-colors shadow-sm"
          />
        </div>
      </div>

      {/* Categories Bar & Provider Filter */}
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
            Todos os Títulos
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

        {/* Provider Selector Dropdown */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-brand-textMuted" />
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="px-3 py-1.5 bg-brand-surface border border-brand-border rounded-xl text-xs font-bold text-white focus:outline-none focus:border-brand-accent cursor-pointer"
          >
            {providers.map((p) => (
              <option key={p.code} value={p.code} className="bg-brand-surface text-white">
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Games Catalog Grid */}
      {loading ? (
        <div className="py-24 text-center text-brand-textMuted space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-accent" />
          <p className="text-xs">Carregando catálogo demonstrativo...</p>
        </div>
      ) : games.length === 0 ? (
        <div className="py-20 text-center text-brand-textMuted bg-brand-surface border border-brand-border rounded-2xl space-y-2">
          <Gamepad2 className="w-8 h-8 mx-auto text-brand-textMuted/60" />
          <p className="text-sm font-semibold text-white">Nenhum jogo encontrado</p>
          <p className="text-xs">Tente ajustar seus termos de busca ou selecionar outra categoria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
          {games.map((game) => (
            <CasinoGameCard key={game.slug} game={game} />
          ))}
        </div>
      )}
    </div>
  );
}
