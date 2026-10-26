"use client";

import React from "react";
import { AlertCircle, ShieldAlert } from "lucide-react";

export function ComplianceBanner() {
  return (
    <div className="bg-brand-card/90 border-b border-brand-border/60 py-2 px-4 text-xs font-medium text-brand-textSecondary flex items-center justify-between z-50">
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs">
          <ShieldAlert className="w-4 h-4 text-brand-accent flex-shrink-0" />
          <span>
            <strong className="text-brand-textPrimary font-semibold">Plataforma 100% Demonstrativa:</strong> Todos os saldos, jogos e eventos utilizam créditos virtuais sem valor monetário real. Não há saques, depósitos nem apostas com dinheiro real.
          </span>
        </div>
        <div className="hidden md:flex items-center gap-3 text-xs flex-shrink-0">
          <span className="bg-brand-surface px-2 py-0.5 rounded border border-brand-border text-brand-accent font-bold">18+</span>
          <span className="text-brand-textMuted">Jogo Responsável e Educacional</span>
        </div>
      </div>
    </div>
  );
}
