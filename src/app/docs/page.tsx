"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Key, Shield, Terminal, CheckCircle2, Copy } from "lucide-react";

interface ApiEndpoint {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  category: "Autenticação" | "Carteira Virtual" | "Cassino & RNG" | "Provedores B2B" | "Apostas Esportivas" | "Administração";
  summary: string;
  description: string;
  requiresAuth: boolean;
  roleRequired?: string;
  requestBody?: any;
  responseSample: any;
}

export default function SwaggerDocsPage() {
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  const endpoints: ApiEndpoint[] = [
    // Auth
    {
      method: "POST",
      path: "/api/auth/register",
      category: "Autenticação",
      summary: "Cadastra novo usuário demonstrativo",
      description: "Cria conta com validação de maioridade (18+), gera carteira virtual com R$ 10.000,00 fictícios e retorna token JWT.",
      requiresAuth: false,
      requestBody: {
        email: "usuario@apex.bet",
        username: "novo_jogador",
        password: "MinhaSenhaForte123!",
        birthDate: "2000-01-01",
      },
      responseSample: {
        success: true,
        data: {
          user: { id: "uuid", email: "usuario@apex.bet", username: "novo_jogador", role: "USER" },
          token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        },
      },
    },
    {
      method: "POST",
      path: "/api/auth/login",
      category: "Autenticação",
      summary: "Autentica usuário e inicia sessão",
      description: "Verifica credenciais e retorna JWT no corpo e no cookie HttpOnly 'apex_session'.",
      requiresAuth: false,
      requestBody: { login: "jogador@apex.bet", password: "DemoPassword123!" },
      responseSample: {
        success: true,
        data: {
          user: { id: "uuid", email: "jogador@apex.bet", username: "demo_player", role: "USER" },
          token: "eyJhbGci...",
        },
      },
    },
    {
      method: "GET",
      path: "/api/auth/me",
      category: "Autenticação",
      summary: "Consulta perfil do usuário autenticado",
      description: "Retorna dados cadastrais, saldo da carteira virtual e parâmetros de jogo responsável.",
      requiresAuth: true,
      responseSample: {
        success: true,
        data: {
          id: "uuid",
          email: "jogador@apex.bet",
          username: "demo_player",
          role: "USER",
          wallet: { demoBalance: 10000.0, currency: "BRL" },
        },
      },
    },

    // Wallet
    {
      method: "GET",
      path: "/api/wallet",
      category: "Carteira Virtual",
      summary: "Consulta saldo e métricas da carteira fictícia",
      description: "Retorna o saldo demonstrativo atual do usuário.",
      requiresAuth: true,
      responseSample: {
        success: true,
        data: { id: "uuid", demoBalance: 10000.0, currency: "BRL", totalDepositedVirtual: 10000.0 },
      },
    },
    {
      method: "POST",
      path: "/api/wallet/faucet",
      category: "Carteira Virtual",
      summary: "Recarrega saldo demonstrativo gratuito (Faucet)",
      description: "Adiciona ou restaura créditos virtuais fictícios de demonstração (padrão R$ 10.000,00).",
      requiresAuth: true,
      requestBody: { targetAmount: 10000.0 },
      responseSample: {
        success: true,
        data: { wallet: { demoBalance: 10000.0 }, transaction: { amount: 500.0, type: "FAUCET_CREDIT" } },
      },
    },
    {
      method: "GET",
      path: "/api/wallet/transactions",
      category: "Carteira Virtual",
      summary: "Extrato transacional atômico",
      description: "Histórico detalhado de movimentações (apostas, ganhos, recargas e estornos) com saldo anterior e posterior.",
      requiresAuth: true,
      responseSample: {
        success: true,
        data: [
          { id: "uuid", type: "CASINO_WIN", amount: 150.0, balanceBefore: 9850.0, balanceAfter: 10000.0, description: "Ganho Apex Crash (2.00x)" },
        ],
      },
    },

    // Casino & RNG
    {
      method: "GET",
      path: "/api/casino/games",
      category: "Cassino & RNG",
      summary: "Consulta catálogo de jogos",
      description: "Filtra jogos por categoria, provedor ou termo de busca.",
      requiresAuth: false,
      responseSample: {
        success: true,
        data: [
          { slug: "gates-of-olympus", title: "Gates of Olympus", rtp: 96.5, volatility: "VERY_HIGH", provider: { name: "Pragmatic Play" } },
        ],
      },
    },
    {
      method: "POST",
      path: "/api/casino/crash",
      category: "Cassino & RNG",
      summary: "Motor do Apex Crash (Aposta ou Cashout)",
      description: "Ações: 'BET' (inicia curva com seed provably fair) ou 'CASHOUT' (valida multiplicador no servidor e credita saldo).",
      requiresAuth: true,
      requestBody: { action: "BET", betAmount: 50.0 },
      responseSample: {
        success: true,
        data: { roundId: "crash_17930...", betAmount: 50.0, crashPoint: 4.82 },
      },
    },
    {
      method: "POST",
      path: "/api/casino/mines",
      category: "Cassino & RNG",
      summary: "Motor do Apex Mines (Iniciar, Revelar ou Cashout)",
      description: "Grade 5x5 interativa com número de minas configurável de 1 a 24.",
      requiresAuth: true,
      requestBody: { action: "PICK", gameId: "mines_1793...", tileIndex: 4 },
      responseSample: {
        success: true,
        data: { isMine: false, currentMultiplier: 1.25, currentPayout: 62.5 },
      },
    },

    // Providers
    {
      method: "GET",
      path: "/api/providers",
      category: "Provedores B2B",
      summary: "Lista status de todos os provedores integrados",
      description: "Retorna status de conexão de Pragmatic Play, PG Soft, Evolution, Spribe, BGaming, NetEnt, Playtech e Agregador.",
      requiresAuth: false,
      responseSample: {
        success: true,
        data: [
          { providerCode: "pragmatic", name: "Pragmatic Play", status: "AWAITING_CREDENTIALS", gamesCount: 8 },
        ],
      },
    },
    {
      method: "POST",
      path: "/api/admin/providers/test",
      category: "Provedores B2B",
      summary: "Testa conectividade com sandbox do fornecedor",
      description: "Efetua ping de health check e valida credenciais no endpoint autorizado.",
      requiresAuth: true,
      roleRequired: "ADMIN | SUPER_ADMIN",
      requestBody: { providerCode: "pragmatic" },
      responseSample: {
        success: true,
        data: { testedAt: "2026-10-26T20:00:00Z", message: "Conexão sandbox estabelecida com sucesso." },
      },
    },

    // Sports
    {
      method: "GET",
      path: "/api/sports/fixtures",
      category: "Apostas Esportivas",
      summary: "Lista partidas ao vivo e pré-jogo com mercados e odds",
      description: "Filtra por esporte ('futebol', 'basquete', etc.) e status 'live'.",
      requiresAuth: false,
      responseSample: {
        success: true,
        data: [
          {
            homeTeam: "Arsenal",
            awayTeam: "Manchester City",
            isLive: true,
            homeScore: 1,
            awayScore: 1,
            markets: [{ key: "1X2", odds: [{ label: "Arsenal", value: 2.85 }] }],
          },
        ],
      },
    },
    {
      method: "POST",
      path: "/api/sports/bet",
      category: "Apostas Esportivas",
      summary: "Registra aposta esportiva (Simples ou Múltipla)",
      description: "Valida odds ativas, verifica saldo demonstrativo, debita créditos de forma atômica e cria bilhete.",
      requiresAuth: true,
      requestBody: {
        type: "SINGLE",
        stake: 50.0,
        selections: [{ eventId: "uuid", marketId: "uuid", oddId: "uuid", oddValue: 2.1 }],
      },
      responseSample: {
        success: true,
        data: { id: "uuid", type: "SINGLE", totalStake: 50.0, totalOdds: 2.1, potentialReturn: 105.0, status: "PENDING" },
      },
    },
    {
      method: "POST",
      path: "/api/sports/cashout",
      category: "Apostas Esportivas",
      summary: "Executa encerramento antecipado (Cashout)",
      description: "Liquida bilhete pendente antes do encerramento da partida e credita o retorno virtual acordado.",
      requiresAuth: true,
      requestBody: { betId: "uuid" },
      responseSample: {
        success: true,
        data: { betId: "uuid", cashoutAmount: 42.5, status: "CASHED_OUT" },
      },
    },

    // Admin
    {
      method: "GET",
      path: "/api/admin/dashboard",
      category: "Administração",
      summary: "Métricas consolidadas do sistema (KPIs)",
      description: "Contagem de usuários, bilhetes, volume financeiro virtual, rodadas e trilhas de auditoria.",
      requiresAuth: true,
      roleRequired: "ADMIN | SUPER_ADMIN",
      responseSample: {
        success: true,
        data: { kpis: { totalUsers: 3, totalBets: 1, totalGameRounds: 4, totalVirtualVolume: 120000.0 } },
      },
    },
  ];

  const categories = ["ALL", "Autenticação", "Carteira Virtual", "Cassino & RNG", "Provedores B2B", "Apostas Esportivas", "Administração"];

  const filtered = activeCategory === "ALL" ? endpoints : endpoints.filter((e) => e.category === activeCategory);

  const copyPath = (path: string) => {
    navigator.clipboard.writeText(path);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/" className="text-brand-textMuted hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-2">
              <BookOpen className="w-7 h-7 text-brand-accent" />
              Documentação da API & Swagger Explorer
            </h1>
          </div>
          <p className="text-xs text-brand-textSecondary mt-1">
            Especificação completa OpenAPI 3.0 para todas as rotas de autenticação, carteira, cassino, provedores e sportsbook.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs bg-brand-surface border border-brand-border px-3 py-1.5 rounded-xl">
          <Shield className="w-4 h-4 text-brand-accent" />
          <span className="font-bold text-white">OpenAPI 3.0.3 Specification</span>
        </div>
      </div>

      {/* Categories Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-brand-border">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setActiveCategory(c)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeCategory === c
                ? "bg-brand-accent text-brand-darkest shadow-glow"
                : "bg-brand-surface border border-brand-border text-brand-textSecondary hover:text-white"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Endpoints List */}
      <div className="space-y-4">
        {filtered.map((ep, idx) => (
          <div
            key={idx}
            className="bg-brand-surface border border-brand-border rounded-2xl p-5 space-y-3 shadow-lg hover:border-brand-border/90 transition-all"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-border/40 pb-2.5">
              <div className="flex items-center gap-3">
                <span
                  className={`px-2.5 py-0.5 rounded-lg text-xs font-black ${
                    ep.method === "GET"
                      ? "bg-blue-950/80 text-blue-300 border border-blue-800"
                      : ep.method === "POST"
                      ? "bg-green-950/80 text-green-300 border border-green-800"
                      : "bg-amber-950/80 text-amber-300 border border-amber-800"
                  }`}
                >
                  {ep.method}
                </span>

                <span className="font-mono text-xs font-bold text-white tracking-wide">
                  {ep.path}
                </span>

                <button
                  onClick={() => copyPath(ep.path)}
                  className="text-brand-textMuted hover:text-white transition-colors"
                  title="Copiar rota"
                >
                  {copiedPath === ep.path ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-accent" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2 text-[10px]">
                {ep.requiresAuth ? (
                  <span className="px-2 py-0.5 rounded bg-brand-darkest border border-brand-border text-brand-accent font-bold flex items-center gap-1">
                    <Key className="w-3 h-3" /> Requer JWT Bearer
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-brand-darkest border border-brand-border text-brand-textMuted font-bold">
                    Público
                  </span>
                )}
                {ep.roleRequired && (
                  <span className="px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800 font-bold">
                    {ep.roleRequired}
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs font-bold text-white">{ep.summary}</p>
            <p className="text-xs text-brand-textSecondary leading-relaxed">{ep.description}</p>

            {/* Code preview accordion */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {ep.requestBody && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-brand-textMuted block mb-1">
                    Exemplo de Payload (Request Body)
                  </span>
                  <pre className="p-3 bg-brand-darkest border border-brand-border/60 rounded-xl text-[11px] font-mono text-brand-textSecondary overflow-x-auto">
                    {JSON.stringify(ep.requestBody, null, 2)}
                  </pre>
                </div>
              )}

              <div className={ep.requestBody ? "" : "md:col-span-2"}>
                <span className="text-[10px] uppercase font-bold text-brand-textMuted block mb-1">
                  Exemplo de Resposta (Status 200 OK)
                </span>
                <pre className="p-3 bg-brand-darkest border border-brand-border/60 rounded-xl text-[11px] font-mono text-brand-accent/90 overflow-x-auto">
                  {JSON.stringify(ep.responseSample, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
