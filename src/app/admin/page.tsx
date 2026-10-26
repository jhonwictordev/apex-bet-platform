"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import {
  ShieldCheck,
  Users,
  Trophy,
  Coins,
  Layers,
  Settings,
  RefreshCw,
  Search,
  CheckCircle,
  AlertTriangle,
  Play,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"DASHBOARD" | "PROVIDERS" | "SPORTS" | "USERS" | "AUDIT">("DASHBOARD");

  // Dashboard Data
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [providers, setProviders] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [sportsEvents, setSportsEvents] = useState<any[]>([]);

  // Action states
  const [loading, setLoading] = useState(true);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Provider Credential modal state
  const [editingProvider, setEditingProvider] = useState<any | null>(null);
  const [provApiKey, setProvApiKey] = useState("");
  const [provEndpoint, setProvEndpoint] = useState("");

  // New Event Form State
  const [newEventHome, setNewEventHome] = useState("");
  const [newEventAway, setNewEventAway] = useState("");
  const [newEventSport, setNewEventSport] = useState("futebol");

  const loadAll = async () => {
    try {
      const [dashRes, provRes, usersRes, sportsRes] = await Promise.all([
        fetch("/api/admin/dashboard"),
        fetch("/api/providers"),
        fetch(`/api/admin/users?query=${userSearch}`),
        fetch("/api/sports/fixtures"),
      ]);

      if (dashRes.ok) {
        const json = await dashRes.json();
        setDashboardData(json.data);
      }
      if (provRes.ok) {
        const json = await provRes.json();
        setProviders(json.data || []);
      }
      if (usersRes.ok) {
        const json = await usersRes.json();
        setUsersList(json.data || []);
      }
      if (sportsRes.ok) {
        const json = await sportsRes.json();
        setSportsEvents(json.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [userSearch]);

  // Test Provider Connection
  const handleTestConnection = async (providerCode: string) => {
    try {
      setActionFeedback(`Testando conexão sandbox com ${providerCode}...`);
      const res = await fetch("/api/admin/providers/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerCode }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionFeedback(`✅ ${data.data.message}`);
        await loadAll();
      } else {
        setActionFeedback(`❌ ${data.error}`);
      }
    } catch (e: any) {
      setActionFeedback(`❌ ${e.message}`);
    }
  };

  // Sync Provider Catalog
  const handleSyncCatalog = async (providerCode: string) => {
    try {
      setActionFeedback(`Sincronizando catálogo de ${providerCode}...`);
      const res = await fetch("/api/admin/providers/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerCode }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionFeedback(`✅ Catálogo sincronizado com sucesso: ${data.data.addedCount} jogos adicionados.`);
        await loadAll();
      } else {
        setActionFeedback(`❌ ${data.error}`);
      }
    } catch (e: any) {
      setActionFeedback(`❌ ${e.message}`);
    }
  };

  // Save Credentials
  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProvider) return;

    try {
      const res = await fetch("/api/admin/providers/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerCode: editingProvider.providerCode,
          apiKey: provApiKey,
          endpointUrl: provEndpoint,
          environment: "SANDBOX",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setEditingProvider(null);
        setProvApiKey("");
        setProvEndpoint("");
        setActionFeedback("Credenciais de sandbox salvas com sucesso!");
        await loadAll();
      } else {
        alert(data.error);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Create Sport Event
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/sports/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sportSlug: newEventSport,
          homeTeam: newEventHome,
          awayTeam: newEventAway,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setNewEventHome("");
        setNewEventAway("");
        setActionFeedback("Novo evento esportivo demonstrativo criado com mercados ativos!");
        await loadAll();
      } else {
        alert(data.error);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Settle Sport Match
  const handleSettleEvent = async (eventId: string, homeScore: number, awayScore: number, winningOddId: string) => {
    try {
      const res = await fetch("/api/admin/sports/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          homeScore,
          awayScore,
          status: "FINISHED",
          winningOddIds: [winningOddId],
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActionFeedback("Partida finalizada e bilhetes de apostas liquidados com sucesso!");
        await loadAll();
      } else {
        alert(data.error);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Toggle User Suspension
  const handleToggleUserSuspension = async (userId: string, currentSuspended: boolean) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          isSuspended: !currentSuspended,
          suspensionReason: !currentSuspended ? "Suspensão preventiva administrativa." : null,
        }),
      });

      if (res.ok) {
        await loadAll();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Admin Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-border pb-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-brand-accent" />
            Painel Administrativo Master
          </h1>
          <p className="text-xs text-brand-textSecondary mt-0.5">
            Gerenciamento global de provedores B2B, catálogo de jogos, apostas esportivas, liquidações e usuários.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1.5 bg-brand-surface border border-brand-border p-1.5 rounded-2xl overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab("DASHBOARD")}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === "DASHBOARD" ? "bg-brand-accent text-brand-darkest shadow-glow" : "text-brand-textSecondary hover:text-white"
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab("PROVIDERS")}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === "PROVIDERS" ? "bg-brand-accent text-brand-darkest shadow-glow" : "text-brand-textSecondary hover:text-white"
            }`}
          >
            Provedores ({providers.length})
          </button>
          <button
            onClick={() => setActiveTab("SPORTS")}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === "SPORTS" ? "bg-brand-accent text-brand-darkest shadow-glow" : "text-brand-textSecondary hover:text-white"
            }`}
          >
            Gerenciador Esportivo
          </button>
          <button
            onClick={() => setActiveTab("USERS")}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === "USERS" ? "bg-brand-accent text-brand-darkest shadow-glow" : "text-brand-textSecondary hover:text-white"
            }`}
          >
            Usuários
          </button>
        </div>
      </div>

      {actionFeedback && (
        <div className="p-3 bg-brand-card border border-brand-accent/50 rounded-xl text-xs font-bold text-white flex items-center justify-between animate-in fade-in">
          <span>{actionFeedback}</span>
          <button onClick={() => setActionFeedback(null)} className="text-xs text-brand-textMuted hover:text-white">
            Fechar
          </button>
        </div>
      )}

      {/* TAB 1: DASHBOARD */}
      {activeTab === "DASHBOARD" && dashboardData && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 space-y-1">
              <span className="text-[11px] font-bold text-brand-textMuted uppercase">Usuários Registrados</span>
              <p className="text-3xl font-black text-white">{dashboardData.kpis.totalUsers}</p>
            </div>
            <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 space-y-1">
              <span className="text-[11px] font-bold text-brand-textMuted uppercase">Apostas Esportivas</span>
              <p className="text-3xl font-black text-white">{dashboardData.kpis.totalBets}</p>
            </div>
            <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 space-y-1">
              <span className="text-[11px] font-bold text-brand-textMuted uppercase">Rodadas de Cassino</span>
              <p className="text-3xl font-black text-white">{dashboardData.kpis.totalGameRounds}</p>
            </div>
            <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 space-y-1">
              <span className="text-[11px] font-bold text-brand-textMuted uppercase">Volume Virtual Movimentado</span>
              <p className="text-xl md:text-2xl font-black text-brand-accent">
                {formatCurrency(dashboardData.kpis.totalVirtualVolume)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Bets */}
            <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 space-y-4">
              <h3 className="font-extrabold text-sm text-white border-b border-brand-border pb-2">
                Apostas Recentes dos Jogadores
              </h3>
              <div className="space-y-2">
                {dashboardData.recentBets?.map((b: any) => (
                  <div key={b.id} className="p-3 bg-brand-darkest border border-brand-border/60 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white block">{b.user?.username}</span>
                      <span className="text-[11px] text-brand-textSecondary">{b.type} • Odd {b.totalOdds}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-white block">{formatCurrency(b.totalStake)}</span>
                      <span className="text-[10px] text-brand-accent font-bold">{b.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Audit Logs */}
            <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 space-y-4">
              <h3 className="font-extrabold text-sm text-white border-b border-brand-border pb-2">
                Trilha de Auditoria & Segurança
              </h3>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {dashboardData.recentAuditLogs?.map((log: any) => (
                  <div key={log.id} className="p-2.5 bg-brand-darkest border border-brand-border/50 rounded-xl text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-brand-accent text-[11px]">{log.action}</span>
                      <span className="text-[10px] text-brand-textMuted">{new Date(log.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-[11px] text-brand-textSecondary">Entidade: {log.entity} • Ator: {log.actorRole || "SYSTEM"}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PROVIDERS & INTEGRATIONS */}
      {activeTab === "PROVIDERS" && (
        <div className="space-y-4">
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-brand-border pb-3">
              <div>
                <h2 className="font-bold text-base text-white">Game Integration Gateway (Provedores B2B)</h2>
                <p className="text-xs text-brand-textSecondary">
                  Conexão com os estúdios prioritários: Pragmatic Play, PG Soft, Evolution, Spribe, BGaming, NetEnt, Playtech e Agregador.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {providers.map((p) => (
                <div key={p.providerCode} className="bg-brand-darkest border border-brand-border rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-sm text-white">{p.name}</h3>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.hasCredentials || p.providerCode === "inhouse"
                          ? "bg-green-950/80 text-green-300 border border-green-800"
                          : "bg-yellow-950/80 text-yellow-300 border border-yellow-800"
                      }`}
                    >
                      {p.statusLabel}
                    </span>
                  </div>

                  <p className="text-[11px] text-brand-textMuted leading-relaxed">{p.message}</p>

                  <div className="text-[10px] text-brand-textSecondary space-y-0.5 pt-1 border-t border-brand-border/40">
                    <div>Jogos no Catálogo: <strong className="text-white">{p.gamesCount}</strong></div>
                    <div>Ambiente: <strong className="text-brand-accent">{p.environment}</strong></div>
                  </div>

                  <div className="flex items-center gap-1.5 pt-2">
                    <button
                      onClick={() => handleTestConnection(p.providerCode)}
                      className="flex-1 py-1.5 bg-brand-card hover:bg-brand-cardHover border border-brand-border text-white rounded-lg text-xs font-bold transition-all"
                    >
                      Testar
                    </button>
                    <button
                      onClick={() => handleSyncCatalog(p.providerCode)}
                      className="flex-1 py-1.5 bg-brand-accent text-brand-darkest hover:bg-brand-accentHover rounded-lg text-xs font-bold transition-all shadow-glowSm"
                    >
                      Sincronizar
                    </button>
                    {p.providerCode !== "inhouse" && (
                      <button
                        onClick={() => {
                          setEditingProvider(p);
                          setProvApiKey("");
                          setProvEndpoint("");
                        }}
                        className="p-1.5 bg-brand-card hover:bg-brand-cardHover border border-brand-border text-brand-textSecondary hover:text-white rounded-lg"
                        title="Configurar Credenciais"
                      >
                        <Settings className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SPORTS MANAGER */}
      {activeTab === "SPORTS" && (
        <div className="space-y-6">
          {/* Create Match */}
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 space-y-4">
            <h2 className="font-bold text-base text-white border-b border-brand-border pb-3">
              Criar Novo Evento Esportivo Demonstrativo
            </h2>
            <form onSubmit={handleCreateEvent} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-brand-textSecondary mb-1">Time Mandante</label>
                <input
                  type="text"
                  required
                  value={newEventHome}
                  onChange={(e) => setNewEventHome(e.target.value)}
                  placeholder="ex: Liverpool"
                  className="w-full px-3 py-2 bg-brand-darkest border border-brand-border rounded-xl text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-textSecondary mb-1">Time Visitante</label>
                <input
                  type="text"
                  required
                  value={newEventAway}
                  onChange={(e) => setNewEventAway(e.target.value)}
                  placeholder="ex: Chelsea"
                  className="w-full px-3 py-2 bg-brand-darkest border border-brand-border rounded-xl text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-textSecondary mb-1">Esporte</label>
                <select
                  value={newEventSport}
                  onChange={(e) => setNewEventSport(e.target.value)}
                  className="w-full px-3 py-2 bg-brand-darkest border border-brand-border rounded-xl text-xs text-white"
                >
                  <option value="futebol">Futebol</option>
                  <option value="basquete">Basquete</option>
                  <option value="tenis">Tênis</option>
                  <option value="esports">E-Sports</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-brand-accent text-brand-darkest font-bold text-xs rounded-xl shadow-glow hover:bg-brand-accentHover"
                >
                  Adicionar Evento
                </button>
              </div>
            </form>
          </div>

          {/* Settle Events List */}
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 space-y-4">
            <h2 className="font-bold text-base text-white border-b border-brand-border pb-3">
              Liquidação de Partidas e Apuração de Resultados
            </h2>
            <div className="space-y-3">
              {sportsEvents.map((ev) => {
                const market1x2 = ev.markets?.find((m: any) => m.key === "1X2");
                return (
                  <div key={ev.id} className="p-4 bg-brand-darkest border border-brand-border rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] text-brand-textMuted uppercase font-bold">{ev.competition?.name}</span>
                      <h3 className="font-bold text-sm text-white">{ev.homeTeam} x {ev.awayTeam}</h3>
                      <span className="text-xs text-brand-accent font-bold">Placar: {ev.homeScore} - {ev.awayScore} ({ev.status})</span>
                    </div>

                    {market1x2 && ev.status !== "FINISHED" && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-brand-textSecondary">Liquidar Vencedor:</span>
                        {market1x2.odds?.map((odd: any) => (
                          <button
                            key={odd.id}
                            onClick={() => handleSettleEvent(ev.id, 2, 1, odd.id)}
                            className="px-3 py-1.5 bg-brand-card hover:bg-brand-cardHover border border-brand-accent/50 text-brand-accent font-bold text-xs rounded-lg transition-colors"
                          >
                            Venceu {odd.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: USERS MANAGER */}
      {activeTab === "USERS" && (
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-brand-border pb-3">
            <h2 className="font-bold text-base text-white">Usuários & Moderação RBAC</h2>
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-brand-textMuted absolute left-3 top-2.5" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Buscar usuário..."
                className="w-full pl-8 pr-3 py-1.5 bg-brand-darkest border border-brand-border rounded-xl text-xs text-white"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-brand-border/60 text-brand-textMuted uppercase text-[10px]">
                  <th className="py-2.5 px-3">Usuário</th>
                  <th className="py-2.5 px-3">E-mail</th>
                  <th className="py-2.5 px-3">Papel</th>
                  <th className="py-2.5 px-3">Saldo Virtual</th>
                  <th className="py-2.5 px-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/40">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-brand-card/40">
                    <td className="py-3 px-3 font-bold text-white">{u.username}</td>
                    <td className="py-3 px-3 text-brand-textSecondary">{u.email}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-brand-accent/20 border border-brand-accent/30 text-brand-accent">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-brand-accent">
                      {formatCurrency(u.wallet?.demoBalance || 0)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleToggleUserSuspension(u.id, u.isSuspended)}
                        className={`px-3 py-1 rounded-lg text-[11px] font-bold ${
                          u.isSuspended
                            ? "bg-green-950 border border-green-800 text-green-300"
                            : "bg-red-950 border border-red-800 text-red-300"
                        }`}
                      >
                        {u.isSuspended ? "Reativar" : "Suspender"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal for editing provider sandbox credentials */}
      {editingProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-brand-surface border border-brand-border rounded-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-extrabold text-base text-white">
              Configurar Sandbox: {editingProvider.name}
            </h3>

            <form onSubmit={handleSaveCredentials} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-brand-textSecondary mb-1">
                  API Key / Token de Acesso Sandbox
                </label>
                <input
                  type="password"
                  value={provApiKey}
                  onChange={(e) => setProvApiKey(e.target.value)}
                  placeholder="Inserir chave autorizada..."
                  className="w-full px-3 py-2 bg-brand-darkest border border-brand-border rounded-xl text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-textSecondary mb-1">
                  Endpoint URL Sandbox
                </label>
                <input
                  type="text"
                  value={provEndpoint}
                  onChange={(e) => setProvEndpoint(e.target.value)}
                  placeholder="https://api.sandbox-provider.com/v1"
                  className="w-full px-3 py-2 bg-brand-darkest border border-brand-border rounded-xl text-xs text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProvider(null)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-brand-card hover:bg-brand-cardHover border border-brand-border text-brand-textSecondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl text-xs font-black bg-brand-accent text-brand-darkest hover:bg-brand-accentHover shadow-glow"
                >
                  Salvar Credenciais
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
