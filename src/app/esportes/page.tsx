"use client";

import React, { useEffect, useState } from "react";
import { SportsEventCard } from "@/components/sports/SportsEventCard";
import {
  Trophy,
  Activity,
  Calendar,
  Database,
  RefreshCw,
  Sparkles,
  Search,
  Filter,
} from "lucide-react";

export default function SportsbookPage() {
  const [selectedSport, setSelectedSport] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL"); // ALL, BRAZIL, EUROPE, LIVE
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [sportsStatus, setSportsStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const loadFixtures = async () => {
    try {
      setLoading(true);
      const isLiveParam = selectedCategory === "LIVE" ? "&live=true" : "";
      const res = await fetch(`/api/sports/fixtures?sport=${selectedSport}${isLiveParam}`);
      if (res.ok) {
        const json = await res.json();
        setFixtures(json.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadStatus = async () => {
    try {
      const res = await fetch("/api/sports/status");
      if (res.ok) {
        const json = await res.json();
        setSportsStatus(json.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadFixtures();
    loadStatus();
  }, [selectedSport, selectedCategory]);

  const handleManualSync = async () => {
    try {
      setSyncing(true);
      setSyncMessage("Sincronizando com TheSportsDB e OpenLigaDB...");
      const res = await fetch("/api/admin/sports/sync", { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        setSyncMessage(`✅ Sincronizados ${json.data?.stats?.totalSaved || 0} confrontos reais!`);
        await loadFixtures();
        await loadStatus();
      } else {
        setSyncMessage(`Aviso: ${json.error || "A sincronização requer login de administrador."}`);
      }
    } catch (err: any) {
      setSyncMessage(`Erro: ${err.message}`);
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMessage(null), 5000);
    }
  };

  // Filter fixtures according to category tab and search term
  const filteredFixtures = fixtures.filter((f) => {
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchHome = (f.homeTeam || "").toLowerCase().includes(term);
      const matchAway = (f.awayTeam || "").toLowerCase().includes(term);
      const matchComp = (f.competition?.name || "").toLowerCase().includes(term);
      if (!matchHome && !matchAway && !matchComp) return false;
    }

    if (selectedCategory === "LIVE") return f.isLive;
    if (selectedCategory === "BRAZIL") {
      const comp = (f.competition?.name || "").toLowerCase();
      const country = (f.competition?.country || "").toLowerCase();
      return comp.includes("brasil") || comp.includes("brasileir") || comp.includes("serie a") || country.includes("brasil");
    }
    if (selectedCategory === "EUROPE") {
      const comp = (f.competition?.name || "").toLowerCase();
      const country = (f.competition?.country || "").toLowerCase();
      return (
        comp.includes("bundesliga") ||
        comp.includes("premier") ||
        comp.includes("champions") ||
        country.includes("alemanha") ||
        country.includes("inglaterra") ||
        country.includes("europa")
      );
    }
    return true;
  });

  const sportsTabs = [
    { slug: "all", name: "Todos os Esportes", icon: "🌐" },
    { slug: "futebol", name: "Futebol", icon: "⚽" },
    { slug: "basquete", name: "Basquete", icon: "🏀" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Real Sports Data Status Panel */}
      <div className="bg-gradient-to-r from-brand-surface via-brand-card to-brand-surface border border-brand-border rounded-2xl p-4 md:p-5 shadow-card space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-accent/10 border border-brand-accent/30 rounded-xl text-brand-accent">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-white font-display">
                  Integração com Dados Esportivos Oficiais
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-brand-accent/20 border border-brand-accent/40 text-brand-accent text-[10px] font-black uppercase">
                  Ao Vivo & Oficial
                </span>
              </div>
              <p className="text-xs text-brand-textSecondary mt-0.5">
                Alimentado por TheSportsDB (Chave Pública 123), OpenLigaDB e API-SPORTS. Jogos, escudos e dados são oriundos de competições oficiais reais.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            {sportsStatus && (
              <div className="text-right hidden sm:block text-[11px] text-brand-textMuted mr-2">
                <div>Partidas no Banco: <strong className="text-white font-mono">{sportsStatus.stats?.totalEventsInDb || fixtures.length}</strong></div>
                <div>Ligas Ativas: <strong className="text-brand-accent font-mono">{sportsStatus.stats?.totalLeaguesInDb || 0}</strong></div>
              </div>
            )}
            <button
              onClick={handleManualSync}
              disabled={syncing}
              className="px-3.5 py-2 bg-brand-accent text-brand-darkest hover:bg-brand-accentHover rounded-xl text-xs font-black transition-all shadow-glow flex items-center gap-2 disabled:opacity-50 active:scale-[0.98]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Sincronizando..." : "Sincronizar APIs"}
            </button>
          </div>
        </div>

        {/* Active Providers Status Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-brand-border/40 text-xs">
          <span className="text-[11px] text-brand-textMuted font-bold">Fontes Conectadas:</span>
          
          <div className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 font-extrabold flex items-center gap-1.5 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            TheSportsDB (Ativo • Chave 123)
          </div>

          <div className="px-2.5 py-1 rounded-lg bg-blue-950/60 border border-blue-800/80 text-blue-300 font-extrabold flex items-center gap-1.5 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            OpenLigaDB (Ativo • Sem Chave)
          </div>

          <div className={`px-2.5 py-1 rounded-lg font-extrabold flex items-center gap-1.5 text-[11px] ${
            sportsStatus?.providers?.API_SPORTS?.keyConfigured
              ? "bg-purple-950/60 border border-purple-800/80 text-purple-300"
              : "bg-amber-950/60 border border-amber-800/80 text-amber-300"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              sportsStatus?.providers?.API_SPORTS?.keyConfigured ? "bg-purple-400" : "bg-amber-400"
            }`} />
            API-SPORTS ({sportsStatus?.providers?.API_SPORTS?.keyConfigured ? "Chave Ativa" : "Configurável no Admin"})
          </div>

          {syncMessage && (
            <span className="ml-auto text-xs font-bold text-brand-accent animate-pulse">
              {syncMessage}
            </span>
          )}
        </div>
      </div>

      {/* Sportsbook Navigation Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-2.5 font-display">
            <Trophy className="w-7 h-7 text-brand-accent" />
            Sportsbook — Confrontos Reais
          </h1>
          <p className="text-xs text-brand-textSecondary mt-1">
            Partidas oficiais de ligas nacionais e internacionais com odds dinâmicas demonstrativas e cupom virtual integrado.
          </p>
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-brand-textMuted absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar equipe ou liga..."
              className="pl-8 pr-3 py-1.5 bg-brand-surface border border-brand-border rounded-xl text-xs text-white placeholder-brand-textMuted focus:outline-none focus:border-brand-accent w-48 sm:w-56"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            <button
              onClick={() => setSelectedCategory("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === "ALL"
                  ? "bg-brand-accent text-brand-darkest shadow-glow"
                  : "bg-brand-surface border border-brand-border text-brand-textSecondary hover:text-white"
              }`}
            >
              Todos ({fixtures.length})
            </button>
            <button
              onClick={() => setSelectedCategory("LIVE")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                selectedCategory === "LIVE"
                  ? "bg-red-600 text-white shadow-glow"
                  : "bg-brand-surface border border-brand-border text-brand-textSecondary hover:text-white"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
              Ao Vivo
            </button>
            <button
              onClick={() => setSelectedCategory("EUROPE")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === "EUROPE"
                  ? "bg-brand-accent text-brand-darkest shadow-glow"
                  : "bg-brand-surface border border-brand-border text-brand-textSecondary hover:text-white"
              }`}
            >
              Bundesliga & Europa
            </button>
            <button
              onClick={() => setSelectedCategory("BRAZIL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === "BRAZIL"
                  ? "bg-brand-accent text-brand-darkest shadow-glow"
                  : "bg-brand-surface border border-brand-border text-brand-textSecondary hover:text-white"
              }`}
            >
              Futebol Brasileiro
            </button>
          </div>
        </div>
      </div>

      {/* Sports Tabs Strip */}
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
        <div className="py-20 text-center text-brand-textMuted space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-accent" />
          <p className="text-xs">Carregando confrontos reais...</p>
        </div>
      ) : filteredFixtures.length === 0 ? (
        <div className="py-16 text-center text-brand-textMuted bg-brand-surface border border-brand-border rounded-2xl space-y-3">
          <p className="text-sm">Nenhum evento encontrado para os filtros selecionados.</p>
          <button
            onClick={handleManualSync}
            className="px-4 py-2 bg-brand-accent text-brand-darkest font-bold text-xs rounded-xl shadow-glow"
          >
            Sincronizar Confrontos Reais Agora
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredFixtures.map((event) => (
            <SportsEventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
