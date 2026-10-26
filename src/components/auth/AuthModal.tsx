"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { X, Lock, Mail, User, AlertCircle, ShieldCheck } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "login" | "register";
}

export function AuthModal({ isOpen, onClose, initialTab = "login" }: AuthModalProps) {
  const { login, register } = useAuth();
  const [tab, setTab] = useState<"login" | "register">(initialTab);

  // Form states
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [regEmail, setRegEmail] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regBirthDate, setRegBirthDate] = useState("2000-01-01");
  const [agree18, setAgree18] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await login(loginIdentifier, loginPassword);
    setLoading(false);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || "Falha ao entrar.");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!agree18) {
      setError("É obrigatório confirmar ter mais de 18 anos.");
      return;
    }

    setLoading(true);
    const res = await register(regEmail, regUsername, regPassword, regBirthDate);
    setLoading(false);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || "Falha ao criar conta.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-brand-surface border border-brand-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-brand-textSecondary hover:text-white transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Tabs */}
        <div className="flex border-b border-brand-border bg-brand-darkest/60">
          <button
            onClick={() => { setTab("login"); setError(null); }}
            className={`flex-1 py-4 text-sm font-bold transition-colors ${
              tab === "login"
                ? "text-brand-accent border-b-2 border-brand-accent bg-brand-surface"
                : "text-brand-textSecondary hover:text-white"
            }`}
          >
            Entrar
          </button>
          <button
            onClick={() => { setTab("register"); setError(null); }}
            className={`flex-1 py-4 text-sm font-bold transition-colors ${
              tab === "register"
                ? "text-brand-accent border-b-2 border-brand-accent bg-brand-surface"
                : "text-brand-textSecondary hover:text-white"
            }`}
          >
            Criar Conta Grátis
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-950/60 border border-red-800/80 rounded-lg flex items-center gap-2 text-red-200 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {tab === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brand-textSecondary mb-1">
                  E-mail ou Usuário
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-brand-textMuted absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="ex: jogador@apex.bet ou admin@apex.bet"
                    className="w-full pl-9 pr-3 py-2.5 bg-brand-darkest border border-brand-border rounded-lg text-sm text-white placeholder-brand-textMuted focus:outline-none focus:border-brand-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-textSecondary mb-1">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-brand-textMuted absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 bg-brand-darkest border border-brand-border rounded-lg text-sm text-white placeholder-brand-textMuted focus:outline-none focus:border-brand-accent"
                  />
                </div>
              </div>

              {/* Quick Demo Credentials Tip */}
              <div className="p-3 bg-brand-darkest/70 border border-brand-border/60 rounded-lg text-xs space-y-1">
                <span className="text-brand-accent font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Contas Pré-configuradas:
                </span>
                <p className="text-brand-textSecondary text-[11px]">
                  <strong>Admin:</strong> admin@apex.bet | AdminPassword123!
                </p>
                <p className="text-brand-textSecondary text-[11px]">
                  <strong>Jogador:</strong> jogador@apex.bet | DemoPassword123!
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-brand-accent text-brand-darkest font-bold text-sm rounded-lg hover:bg-brand-accentHover transition-colors shadow-glow disabled:opacity-50"
              >
                {loading ? "Entrando..." : "Acessar Plataforma"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-brand-textSecondary mb-1">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-brand-textMuted absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full pl-9 pr-3 py-2 bg-brand-darkest border border-brand-border rounded-lg text-sm text-white placeholder-brand-textMuted focus:outline-none focus:border-brand-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-textSecondary mb-1">
                  Nome de Usuário
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-brand-textMuted absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="ex: apostador_pro"
                    className="w-full pl-9 pr-3 py-2 bg-brand-darkest border border-brand-border rounded-lg text-sm text-white placeholder-brand-textMuted focus:outline-none focus:border-brand-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-textSecondary mb-1">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-brand-textMuted absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-9 pr-3 py-2 bg-brand-darkest border border-brand-border rounded-lg text-sm text-white placeholder-brand-textMuted focus:outline-none focus:border-brand-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-textSecondary mb-1">
                  Data de Nascimento (18+)
                </label>
                <input
                  type="date"
                  required
                  value={regBirthDate}
                  onChange={(e) => setRegBirthDate(e.target.value)}
                  className="w-full px-3 py-2 bg-brand-darkest border border-brand-border rounded-lg text-sm text-white focus:outline-none focus:border-brand-accent"
                />
              </div>

              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  id="agree18"
                  checked={agree18}
                  onChange={(e) => setAgree18(e.target.checked)}
                  className="mt-1 accent-brand-accent cursor-pointer"
                />
                <label htmlFor="agree18" className="text-[11px] text-brand-textSecondary cursor-pointer leading-tight">
                  Declaro ter 18 anos ou mais e estou ciente de que esta plataforma opera estritamente com créditos de demonstração fictícios.
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-brand-accent text-brand-darkest font-bold text-sm rounded-lg hover:bg-brand-accentHover transition-colors shadow-glow disabled:opacity-50"
              >
                {loading ? "Cadastrando..." : "Cadastrar e Receber R$ 10.000 Fictícios"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
