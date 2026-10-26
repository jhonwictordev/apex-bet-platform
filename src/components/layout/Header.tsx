"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { useBetSlip } from "@/context/bet-slip-context";
import { AuthModal } from "@/components/auth/AuthModal";
import {
  Wallet,
  RefreshCw,
  User,
  LogOut,
  Shield,
  Ticket,
  ChevronDown,
  Sparkles,
  Gamepad2,
  Trophy,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export function Header() {
  const { user, logout, refillFaucet } = useAuth();
  const { selections, setIsOpen: setOpenBetSlip } = useBetSlip();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialTab, setAuthInitialTab] = useState<"login" | "register">("login");
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [faucetLoading, setFaucetLoading] = useState(false);

  const handleRefill = async () => {
    setFaucetLoading(true);
    const res = await refillFaucet();
    setFaucetLoading(false);
    if (!res.success && res.message) {
      alert(res.message);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-brand-surface/95 backdrop-blur-md border-b border-brand-border">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo & Navigation Tabs */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-brand-accent flex items-center justify-center font-black text-brand-darkest text-xl shadow-glow">
                A
              </div>
              <div className="flex flex-col">
                <span className="font-black text-xl tracking-wider text-white flex items-center gap-1">
                  APEX<span className="text-brand-accent">BET</span>
                </span>
                <span className="text-[9px] uppercase tracking-widest text-brand-textSecondary -mt-1 font-bold">
                  Demo Experience
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/cassino"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-brand-textSecondary hover:text-white hover:bg-brand-card transition-colors"
              >
                <Gamepad2 className="w-4 h-4 text-brand-accent" />
                Cassino
              </Link>
              <Link
                href="/esportes"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-brand-textSecondary hover:text-white hover:bg-brand-card transition-colors"
              >
                <Trophy className="w-4 h-4 text-brand-accent" />
                Esportes
              </Link>
              <Link
                href="/cassino?category=originais"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-brand-textSecondary hover:text-white hover:bg-brand-card transition-colors"
              >
                <Sparkles className="w-4 h-4 text-yellow-400" />
                Originais
              </Link>
            </nav>
          </div>

          {/* User Controls & Virtual Wallet */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* Virtual Balance Faucet Pill */}
                <div className="flex items-center bg-brand-darkest border border-brand-border rounded-xl p-1 pl-3 gap-2">
                  <div className="flex flex-col items-start leading-none pr-1">
                    <span className="text-[10px] uppercase font-bold text-brand-textMuted tracking-wider">
                      Saldo Virtual
                    </span>
                    <span className="text-sm font-extrabold text-brand-accent">
                      {formatCurrency(user.wallet?.demoBalance || 0)}
                    </span>
                  </div>

                  <button
                    onClick={handleRefill}
                    disabled={faucetLoading}
                    title="Recarregar Saldo Demonstrativo"
                    className="p-1.5 bg-brand-card hover:bg-brand-cardHover border border-brand-border rounded-lg text-brand-accent hover:text-white transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${faucetLoading ? "animate-spin" : ""}`} />
                  </button>
                </div>

                {/* Bet Slip Trigger */}
                <button
                  onClick={() => setOpenBetSlip(true)}
                  className="relative p-2.5 bg-brand-card hover:bg-brand-cardHover border border-brand-border rounded-xl text-brand-textSecondary hover:text-white transition-colors flex items-center justify-center"
                  title="Cupom de Apostas"
                >
                  <Ticket className="w-4 h-4 text-brand-accent" />
                  {selections.length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-brand-accent text-brand-darkest text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-glow">
                      {selections.length}
                    </span>
                  )}
                </button>

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 pl-2.5 bg-brand-card hover:bg-brand-cardHover border border-brand-border rounded-xl text-sm font-semibold transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-brand-border flex items-center justify-center font-bold text-white text-xs">
                      {user.username.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="hidden sm:inline max-w-[100px] truncate text-white">
                      {user.username}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-brand-textMuted" />
                  </button>

                  {userDropdownOpen && (
                    <div
                      onMouseLeave={() => setUserDropdownOpen(false)}
                      className="absolute right-0 mt-2 w-56 bg-brand-surface border border-brand-border rounded-xl shadow-2xl p-1.5 z-50 text-xs space-y-1 animate-in fade-in zoom-in-95 duration-100"
                    >
                      <div className="px-3 py-2 border-b border-brand-border mb-1">
                        <p className="font-bold text-white truncate">{user.username}</p>
                        <p className="text-[11px] text-brand-textMuted truncate">{user.email}</p>
                        <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-brand-accent/20 border border-brand-accent/30 text-brand-accent font-bold text-[10px]">
                          {user.role}
                        </span>
                      </div>

                      <Link
                        href="/minhas-apostas"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-brand-textSecondary hover:text-white hover:bg-brand-card transition-colors"
                      >
                        <Ticket className="w-3.5 h-3.5 text-brand-accent" />
                        Minhas Apostas Esportivas
                      </Link>

                      <Link
                        href="/carteira"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-brand-textSecondary hover:text-white hover:bg-brand-card transition-colors"
                      >
                        <Wallet className="w-3.5 h-3.5 text-brand-accent" />
                        Extrato da Carteira Virtual
                      </Link>

                      <Link
                        href="/perfil"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-brand-textSecondary hover:text-white hover:bg-brand-card transition-colors"
                      >
                        <User className="w-3.5 h-3.5 text-brand-accent" />
                        Perfil & Jogo Responsável
                      </Link>

                      {(user.role === "ADMIN" || user.role === "SUPER_ADMIN") && (
                        <Link
                          href="/admin"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-brand-accent font-bold bg-brand-accent/10 hover:bg-brand-accent/20 border border-brand-accent/30 transition-colors"
                        >
                          <Shield className="w-3.5 h-3.5" />
                          Painel Administrativo
                        </Link>
                      )}

                      <div className="border-t border-brand-border pt-1">
                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            logout();
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-400 hover:bg-red-950/40 transition-colors text-left"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Sair da Conta
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setAuthInitialTab("login");
                    setAuthModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-white hover:bg-brand-card transition-colors"
                >
                  Entrar
                </button>
                <button
                  onClick={() => {
                    setAuthInitialTab("register");
                    setAuthModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-bold bg-brand-accent text-brand-darkest hover:bg-brand-accentHover transition-colors shadow-glow"
                >
                  Cadastre-se
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialTab={authInitialTab}
      />
    </>
  );
}
