"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import {
  Home,
  Gamepad2,
  Trophy,
  Activity,
  Sparkles,
  Layers,
  Ticket,
  Wallet,
  ShieldAlert,
  Headphones,
  ShieldCheck,
  Flame,
  Zap,
} from "lucide-react";

export function SidebarNavigation() {
  const pathname = usePathname();
  const { user } = useAuth();

  const mainLinks = [
    { label: "Início", href: "/", icon: Home },
    { label: "Cassino", href: "/cassino", icon: Gamepad2 },
    { label: "Esportes", href: "/esportes", icon: Trophy },
    { label: "Ao Vivo", href: "/esportes?live=true", icon: Activity, badge: "LIVE" },
  ];

  const originals = [
    { label: "Apex Crash", href: "/cassino/originais/apex-crash", icon: Zap, hot: true },
    { label: "Apex Mines", href: "/cassino/originais/apex-mines", icon: Sparkles },
    { label: "Apex Plinko", href: "/cassino/originais/apex-plinko", icon: Layers },
    { label: "Roleta Royale", href: "/cassino/originais/apex-roulette", icon: Flame },
    { label: "Blackjack VIP", href: "/cassino/originais/apex-blackjack", icon: Trophy },
    { label: "Cyber Dice", href: "/cassino/originais/apex-dice", icon: Gamepad2 },
  ];

  const userLinks = [
    { label: "Minhas Apostas", href: "/minhas-apostas", icon: Ticket },
    { label: "Extrato Virtual", href: "/carteira", icon: Wallet },
    { label: "Jogo Responsável", href: "/perfil", icon: ShieldAlert },
    { label: "Suporte 24/7", href: "/suporte", icon: Headphones },
  ];

  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-brand-surface/90 border-r border-brand-border h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto p-4 space-y-6">
      {/* Main Navigation Section */}
      <div className="space-y-1">
        <span className="text-[10px] font-black tracking-widest text-brand-textMuted uppercase px-3">
          Navegação Principal
        </span>
        {mainLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 ${
                isActive
                  ? "bg-brand-accent text-brand-darkest shadow-glow"
                  : "text-brand-textSecondary hover:text-white hover:bg-brand-card"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? "text-brand-darkest" : "text-brand-accent"}`} />
                <span>{link.label}</span>
              </div>
              {link.badge && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-red-600 text-white animate-pulse">
                  {link.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Apex Originals Section */}
      <div className="space-y-1">
        <span className="text-[10px] font-black tracking-widest text-brand-textMuted uppercase px-3">
          Apex Originals (RNG)
        </span>
        {originals.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? "bg-brand-card border border-brand-accent/50 text-brand-accent"
                  : "text-brand-textSecondary hover:text-white hover:bg-brand-card"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? "text-brand-accent" : "text-brand-textMuted"}`} />
                <span>{item.label}</span>
              </div>
              {item.hot && (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-brand-accent/20 border border-brand-accent/40 text-brand-accent">
                  HOT
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Account & Support Section */}
      <div className="space-y-1">
        <span className="text-[10px] font-black tracking-widest text-brand-textMuted uppercase px-3">
          Conta & Suporte
        </span>
        {userLinks.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? "bg-brand-card text-brand-accent"
                  : "text-brand-textSecondary hover:text-white hover:bg-brand-card"
              }`}
            >
              <Icon className="w-4 h-4 text-brand-textMuted" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Admin Quick Action */}
      {isAdmin && (
        <div className="pt-2 border-t border-brand-border">
          <Link
            href="/admin"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-black bg-brand-accent/10 border border-brand-accent/30 text-brand-accent hover:bg-brand-accent/20 transition-all shadow-sm"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Painel Administrativo</span>
          </Link>
        </div>
      )}

      {/* Responsible Gaming Notice */}
      <div className="mt-auto p-3.5 bg-brand-card/80 border border-brand-border rounded-2xl text-[11px] text-brand-textMuted leading-relaxed">
        <p className="font-bold text-brand-textSecondary mb-1 flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-brand-accent" /> Modo Fictício Ativo
        </p>
        Apostas 100% simuladas sem valor financeiro ou conversão monetária.
      </div>
    </aside>
  );
}
