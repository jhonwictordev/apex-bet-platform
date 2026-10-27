"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Gamepad2, Trophy, Ticket, User } from "lucide-react";
import { useBetSlip } from "@/context/bet-slip-context";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { selections, setIsOpen } = useBetSlip();

  const links = [
    { label: "Início", href: "/", icon: Home },
    { label: "Cassino", href: "/cassino", icon: Gamepad2 },
    { label: "Esportes", href: "/esportes", icon: Trophy },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-brand-darkest/95 backdrop-blur-xl border-t border-brand-border lg:hidden px-2 py-1.5 flex items-center justify-around">
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = pathname === link.href;

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex flex-col items-center justify-center p-1.5 min-w-[56px] rounded-xl transition-all ${
              isActive
                ? "text-brand-accent font-bold"
                : "text-brand-textMuted hover:text-white"
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? "text-brand-accent" : "text-brand-textMuted"}`} />
            <span className="text-[10px] mt-0.5">{link.label}</span>
          </Link>
        );
      })}

      {/* BetSlip Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="relative flex flex-col items-center justify-center p-1.5 min-w-[56px] text-brand-textMuted hover:text-white"
      >
        <div className="relative">
          <Ticket className="w-5 h-5 text-brand-textMuted" />
          {selections.length > 0 && (
            <span className="absolute -top-1.5 -right-2 bg-brand-accent text-brand-darkest text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-glow">
              {selections.length}
            </span>
          )}
        </div>
        <span className="text-[10px] mt-0.5">Cupom</span>
      </button>

      {/* Profile */}
      <Link
        href="/perfil"
        className={`flex flex-col items-center justify-center p-1.5 min-w-[56px] rounded-xl transition-all ${
          pathname === "/perfil"
            ? "text-brand-accent font-bold"
            : "text-brand-textMuted hover:text-white"
        }`}
      >
        <User className={`w-5 h-5 ${pathname === "/perfil" ? "text-brand-accent" : "text-brand-textMuted"}`} />
        <span className="text-[10px] mt-0.5">Perfil</span>
      </Link>
    </nav>
  );
}
