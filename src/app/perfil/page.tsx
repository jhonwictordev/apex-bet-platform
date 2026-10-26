"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { User, ShieldAlert, Clock, AlertTriangle, CheckCircle, ShieldCheck } from "lucide-react";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();

  const [sessionMinutes, setSessionMinutes] = useState<number>(
    user?.compliance?.sessionTimeLimitMinutes || 60
  );
  const [exclusionDays, setExclusionDays] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSaveCompliance = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/support/self-exclusion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionTimeLimitMinutes: sessionMinutes,
          selfExclusionDays: exclusionDays,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage(
          exclusionDays > 0
            ? `Autoexclusão ativada por ${exclusionDays} dias. Sua conta será temporariamente bloqueada.`
            : "Limites de sessão atualizados com sucesso."
        );
        await refreshUser();
      } else {
        setMessage(data.error || "Falha ao atualizar configurações.");
      }
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <User className="w-6 h-6 text-brand-accent" />
          Perfil do Usuário & Jogo Responsável
        </h1>
        <p className="text-xs text-brand-textSecondary mt-0.5">
          Gerenciamento de conta, segurança e ferramentas de proteção e limites de jogo.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-accent/20 border border-brand-accent/40 flex items-center justify-center font-black text-2xl text-brand-accent mx-auto">
            {user?.username?.substring(0, 2).toUpperCase() || "US"}
          </div>

          <div className="text-center space-y-1">
            <h2 className="text-base font-bold text-white">{user?.username}</h2>
            <p className="text-xs text-brand-textMuted">{user?.email}</p>
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black bg-brand-accent/20 border border-brand-accent/30 text-brand-accent">
              Papel: {user?.role}
            </span>
          </div>

          <div className="pt-3 border-t border-brand-border/60 text-xs space-y-2 text-brand-textSecondary">
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="font-bold text-green-400">Ativo</span>
            </div>
            <div className="flex justify-between">
              <span>Modo da Conta:</span>
              <span className="font-bold text-brand-accent">Fictício / Demo</span>
            </div>
          </div>
        </div>

        {/* Responsible Gaming Tools */}
        <div className="md:col-span-2 bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-brand-border">
            <ShieldAlert className="w-5 h-5 text-brand-accent" />
            <h2 className="font-bold text-base text-white">Ferramentas de Proteção e Limites</h2>
          </div>

          {message && (
            <div className="p-3 bg-brand-card border border-brand-accent/40 rounded-xl text-xs text-white flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-brand-accent flex-shrink-0" />
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleSaveCompliance} className="space-y-4">
            {/* Session Timer */}
            <div>
              <label className="block text-xs font-bold text-white mb-1 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-brand-accent" />
                Alerta de Tempo de Sessão Contínua (Minutos)
              </label>
              <select
                value={sessionMinutes}
                onChange={(e) => setSessionMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 bg-brand-darkest border border-brand-border rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-brand-accent"
              >
                <option value={30}>30 Minutos</option>
                <option value={60}>60 Minutos (Recomendado)</option>
                <option value={120}>120 Minutos</option>
                <option value={180}>180 Minutos</option>
              </select>
            </div>

            {/* Self-Exclusion */}
            <div className="p-4 bg-brand-darkest border border-brand-border rounded-2xl space-y-2">
              <label className="block text-xs font-bold text-red-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Autoexclusão Voluntária Temporária
              </label>
              <p className="text-[11px] text-brand-textSecondary leading-relaxed">
                Ao selecionar um período de autoexclusão, seu acesso à realização de apostas virtuais e jogos de demonstração será bloqueado até o término do prazo.
              </p>
              <select
                value={exclusionDays}
                onChange={(e) => setExclusionDays(Number(e.target.value))}
                className="w-full px-3 py-2 bg-brand-surface border border-brand-border rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-red-500"
              >
                <option value={0}>Nenhuma autoexclusão ativa</option>
                <option value={1}>Pausa de 24 Horas</option>
                <option value={7}>Pausa de 7 Dias</option>
                <option value={30}>Pausa de 30 Dias</option>
                <option value={180}>Pausa de 6 Meses</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-brand-accent text-brand-darkest font-bold text-xs rounded-xl hover:bg-brand-accentHover transition-all shadow-glow disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Salvar Configurações de Jogo Responsável"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
