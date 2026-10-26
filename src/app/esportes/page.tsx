"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useBetSlip } from "@/context/bet-slip-context";
import {
  Trophy,
  Activity,
  Calendar,
  ShieldCheck,
  ChevronRight,
  Database,
  RefreshCw,
  ExternalLink,
  Flame,
  CheckCircle2,
} from "lucide-react";

export default function SportsbookPage() {
  const { addSelection, selections } = useBetSlip();

  const [selectedSport, setSelectedSport] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL"); // ALL, BRAZIL, EUROPE, LIVE
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [sportsStatus, setSportsStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

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
        setSyncMessage(`✅ Sincronizados ${json.data?.stats?.totalSaved || 0} jogos reais!`);
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

  // Filter fixtures according to category tab
  const filteredFixtures = fixtures.filter((f) => {
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

  const getSourceBadge = (source?: string) => {
    switch (source) {
      case "THESPORTSDB":
        return {
          label: "Fonte: TheSportsDB (API Oficial)",
          className: "bg-emerald-950/80 border-emerald-800 text-emerald-400",
          dotColor: "bg-emerald-400",
        };
      case "OPENLIGADB":
        return {
          label: "Fonte: OpenLigaDB (Alemanha/Europa)",
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
          label: "Fonte: Apex Sports Gateway",
          className: "bg-zinc-800 border-zinc-700 text-zinc-300",
          dotColor: "bg-zinc-400",
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Real Sports Data Status Banner */}
      <div className="bg-gradient-to-r from-brand-surface via-brand-card to-brand-surface border border-brand-border rounded-2xl p-4 md:p-5 shadow-lg space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-accent/10 border border-brand-accent/30 rounded-xl text-brand-accent">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-white">Integração com Dados Esportivos Reais</h3>
                <span className="px-2 py-0.5 rounded-full bg-brand-accent/20 border border-brand-accent/40 text-brand-accent text-[10px] font-black uppercase">
                  Ao Vivo & Oficial
                </span>
              </div>
              <p className="text-xs text-brand-textSecondary mt-0.5">
                Alimentado por TheSportsDB (Key 123), OpenLigaDB e API-SPORTS. Todos os jogos, escudos e placares são dados reais de competições oficiais.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            {sportsStatus && (
              <div className="text-right hidden sm:block text-[11px] text-brand-textMuted mr-2">
                <div>Partidas no Banco: <strong className="text-white">{sportsStatus.stats?.totalEventsInDb || fixtures.length}</strong></div>
                <div>Ligas Ativas: <strong className="text-brand-accent">{sportsStatus.stats?.totalLeaguesInDb || 0}</strong></div>
              </div>
            )}
            <button
              onClick={handleManualSync}
              disabled={syncing}
              className="px-3.5 py-2 bg-brand-accent text-brand-darkest hover:bg-brand-accentHover rounded-xl text-xs font-bold transition-all shadow-glow flex items-center gap-2 disabled:opacity-50"
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
          <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-2">
            <Trophy className="w-7 h-7 text-brand-accent" />
            Sportsbook — Confrontos Reais
          </h1>
          <p className="text-xs text-brand-textSecondary mt-1">
            Partidas reais de ligas internacionais e nacionais com odds dinâmicas demonstrativas e apostas virtuais instantâneas.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedCategory === "ALL"
                ? "bg-brand-accent text-brand-darkest shadow-glow"
                : "bg-brand-surface border border-brand-border text-brand-textSecondary hover:text-white"
            }`}
          >
            Todos os Jogos
          </button>
          <button
            onClick={() => setSelectedCategory("LIVE")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              selectedCategory === "LIVE"
                ? "bg-red-600 text-white shadow-glow"
                : "bg-brand-surface border border-brand-border text-brand-textSecondary hover:text-white"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
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
        <div className="space-y-4">
          {filteredFixtures.map((event) => {
            const mainMarket = event.markets?.[0];
            const sourceBadge = getSourceBadge(event.externalSource);

            return (
              <div
                key={event.id}
                className="bg-brand-surface border border-brand-border rounded-2xl p-4 md:p-5 hover:border-brand-border/90 transition-all shadow-md space-y-4"
              >
                {/* Competition Bar & Source Origin */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-brand-textMuted border-b border-brand-border/40 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-white">{event.sport?.name || "Futebol"}</span>
                    <span>•</span>
                    <span className="text-brand-textSecondary font-bold">{event.competition?.name}</span>
                    <span className="text-brand-textMuted">({event.competition?.country || "Oficial"})</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Origin Badge */}
                    <span
                      className={`px-2 py-0.5 rounded border text-[10px] font-bold flex items-center gap-1.5 ${sourceBadge.className}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${sourceBadge.dotColor}`} />
                      {sourceBadge.label}
                    </span>

                    {event.isLive ? (
                      <span className="px-2 py-0.5 rounded bg-red-950/80 border border-red-800 text-red-400 font-extrabold flex items-center gap-1.5 text-[10px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        AO VIVO {event.currentPeriod ? `• ${event.currentPeriod}` : ""} {event.currentMinute ? `${event.currentMinute}'` : ""}
                      </span>
                    ) : (
                      <span className="text-brand-textMuted text-[11px] flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-brand-accent" />
                        {new Date(event.startTime).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Match Teams, Badges and Scores */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                  <div className="lg:col-span-5 space-y-3">
                    {/* Home Team */}
                    <div className="flex items-center justify-between font-bold text-sm">
                      <div className="flex items-center gap-2.5">
                        {event.homeLogo ? (
                          <img
                            src={event.homeLogo}
                            alt={event.homeTeam}
                            className="w-6 h-6 object-contain rounded-full bg-white/5 p-0.5"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-brand-card border border-brand-border flex items-center justify-center text-[10px] text-brand-accent font-black">
                            {event.homeTeam.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span className="text-white hover:text-brand-accent transition-colors">
                          {event.homeTeam}
                        </span>
                      </div>
                      <span className="text-brand-accent font-black text-lg px-2">
                        {event.homeScore}
                      </span>
                    </div>

                    {/* Away Team */}
                    <div className="flex items-center justify-between font-bold text-sm">
                      <div className="flex items-center gap-2.5">
                        {event.awayLogo ? (
                          <img
                            src={event.awayLogo}
                            alt={event.awayTeam}
                            className="w-6 h-6 object-contain rounded-full bg-white/5 p-0.5"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-brand-card border border-brand-border flex items-center justify-center text-[10px] text-brand-accent font-black">
                            {event.awayTeam.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span className="text-white hover:text-brand-accent transition-colors">
                          {event.awayTeam}
                        </span>
                      </div>
                      <span className="text-brand-accent font-black text-lg px-2">
                        {event.awayScore}
                      </span>
                    </div>
                  </div>

                  {/* Market Odds Buttons */}
                  <div className="lg:col-span-7">
                    {mainMarket && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-brand-textMuted uppercase font-bold tracking-wider">
                            {mainMarket.name}
                          </span>
                          <Link
                            href={`/esportes/evento/${event.id}`}
                            className="text-[11px] font-bold text-brand-accent hover:underline flex items-center gap-1"
                          >
                            Radar & Estatísticas <ChevronRight className="w-3 h-3" />
                          </Link>
                        </div>

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
