"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { Ticket, CheckCircle2, XCircle, Clock, DollarSign, ArrowLeft } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function MyBetsPage() {
  const { user, refreshUser } = useAuth();
  const [bets, setBets] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [cashoutLoading, setCashoutLoading] = useState<string | null>(null);

  const loadBets = async () => {
    try {
      const res = await fetch(`/api/sports/my-bets?status=${filter}`);
      if (res.ok) {
        const json = await res.json();
        setBets(json.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBets();
  }, [filter]);

  const handleCashout = async (betId: string) => {
    setCashoutLoading(betId);
    try {
      const res = await fetch("/api/sports/cashout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ betId }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        await refreshUser();
        await loadBets();
      } else {
        alert(data.error || "Falha no cashout.");
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setCashoutLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "WON":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-green-950/80 border border-green-800 text-green-300 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> GANHA
          </span>
        );
      case "LOST":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-red-950/80 border border-red-800 text-red-300 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5 text-red-400" /> PERDIDA
          </span>
        );
      case "CASHED_OUT":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-950/80 border border-amber-800 text-amber-300 flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5" /> CASHOUT
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-950/80 border border-blue-800 text-blue-300 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> EM ANDAMENTO
          </span>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Ticket className="w-6 h-6 text-brand-accent" />
            Minhas Apostas Esportivas
          </h1>
          <p className="text-xs text-brand-textSecondary mt-0.5">
            Acompanhe o status dos seus bilhetes e encerre apostas antecipadamente.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-brand-surface border border-brand-border p-1 rounded-xl text-xs font-bold">
          {["ALL", "PENDING", "WON", "LOST"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filter === f
                  ? "bg-brand-accent text-brand-darkest shadow-glow"
                  : "text-brand-textSecondary hover:text-white"
              }`}
            >
              {f === "ALL" ? "Todas" : f === "PENDING" ? "Abertas" : f === "WON" ? "Ganhas" : "Perdidas"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-brand-textMuted">Carregando apostas...</div>
      ) : bets.length === 0 ? (
        <div className="py-20 text-center text-brand-textMuted bg-brand-surface border border-brand-border rounded-2xl space-y-3">
          <Ticket className="w-10 h-10 text-brand-textMuted mx-auto opacity-50" />
          <p className="text-sm font-semibold">Nenhuma aposta encontrada nesta categoria.</p>
          <Link
            href="/esportes"
            className="inline-block px-4 py-2 bg-brand-accent text-brand-darkest font-bold text-xs rounded-xl shadow-glow"
          >
            Explorar Eventos Esportivos
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bets.map((bet) => (
            <div
              key={bet.id}
              className="bg-brand-surface border border-brand-border rounded-2xl p-5 space-y-4 shadow-lg"
            >
              <div className="flex items-center justify-between border-b border-brand-border/40 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-white text-sm">
                    Aposta {bet.type === "MULTIPLE" ? "Múltipla Acumulada" : "Simples"}
                  </span>
                  <span className="text-xs text-brand-textMuted">• {new Date(bet.createdAt).toLocaleString("pt-BR")}</span>
                </div>
                {getStatusBadge(bet.status)}
              </div>

              {/* Selections */}
              <div className="space-y-2">
                {bet.selections?.map((sel: any) => (
                  <div
                    key={sel.id}
                    className="p-3 bg-brand-darkest border border-brand-border/60 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-white block">{sel.selectionLabel}</span>
                      <span className="text-brand-textSecondary text-[11px]">{sel.eventName} • {sel.marketName}</span>
                    </div>
                    <span className="font-extrabold text-brand-accent text-sm">
                      {sel.oddValue.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Stake & Return Footer */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-brand-border/40 text-xs">
                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-brand-textMuted block text-[10px] uppercase font-bold">Valor Apostado</span>
                    <span className="font-bold text-white">{formatCurrency(bet.totalStake)}</span>
                  </div>
                  <div>
                    <span className="text-brand-textMuted block text-[10px] uppercase font-bold">Odd Total</span>
                    <span className="font-bold text-white">{bet.totalOdds.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-brand-textMuted block text-[10px] uppercase font-bold">
                      {bet.status === "WON" ? "Retorno Pago" : "Retorno Potencial"}
                    </span>
                    <span className="font-extrabold text-brand-accent text-sm">
                      {formatCurrency(bet.status === "WON" ? bet.actualReturn : bet.potentialReturn)}
                    </span>
                  </div>
                </div>

                {bet.status === "PENDING" && (
                  <button
                    onClick={() => handleCashout(bet.id)}
                    disabled={cashoutLoading === bet.id}
                    className="px-4 py-2 bg-brand-card hover:bg-brand-cardHover border border-brand-accent/40 text-brand-accent rounded-xl font-black text-xs transition-all shadow-glowSm disabled:opacity-50"
                  >
                    {cashoutLoading === bet.id ? "Encerrando..." : "Cashout Antecipado"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
