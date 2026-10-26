"use client";

import React, { useState } from "react";
import { useBetSlip } from "@/context/bet-slip-context";
import { useAuth } from "@/context/auth-context";
import { X, Trash2, CheckCircle, AlertCircle, Ticket, ChevronUp, ChevronDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export function BetSlipModal() {
  const {
    selections,
    isOpen,
    setIsOpen,
    stake,
    setStake,
    betType,
    setBetType,
    removeSelection,
    clearSlip,
    totalOdds,
    potentialReturn,
    placeBet,
    isSubmitting,
  } = useBetSlip();

  const { user } = useAuth();
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  if (selections.length === 0 && !isOpen) return null;

  const handleConfirm = async () => {
    setFeedback(null);
    const res = await placeBet();
    if (res.success) {
      setFeedback({ success: true, message: res.message || "Aposta registrada com sucesso!" });
      setTimeout(() => {
        setFeedback(null);
        setIsOpen(false);
      }, 3000);
    } else {
      setFeedback({ success: false, message: res.message || "Falha ao registrar aposta." });
    }
  };

  const quickStakes = [10, 25, 50, 100, 250];

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm">
      {/* Header Bar */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="bg-brand-surface border border-brand-border rounded-t-2xl p-3 flex items-center justify-between cursor-pointer hover:border-brand-accent/50 transition-colors shadow-2xl"
      >
        <div className="flex items-center gap-2">
          <Ticket className="w-5 h-5 text-brand-accent" />
          <span className="font-extrabold text-sm text-white">Cupom de Apostas</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-black bg-brand-accent text-brand-darkest">
            {selections.length}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {totalOdds > 0 && (
            <span className="text-xs font-bold text-brand-accent">
              Odd {totalOdds.toFixed(2)}
            </span>
          )}
          {isOpen ? <ChevronDown className="w-4 h-4 text-brand-textMuted" /> : <ChevronUp className="w-4 h-4 text-brand-textMuted" />}
        </div>
      </div>

      {/* Expanded Body */}
      {isOpen && (
        <div className="bg-brand-surface border-x border-b border-brand-border rounded-b-2xl p-4 space-y-4 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-150 max-h-[70vh] overflow-y-auto">
          {feedback && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                feedback.success
                  ? "bg-green-950/70 border border-green-800 text-green-200"
                  : "bg-red-950/70 border border-red-800 text-red-200"
              }`}
            >
              {feedback.success ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{feedback.message}</span>
            </div>
          )}

          {selections.length > 1 && (
            <div className="flex bg-brand-darkest p-1 rounded-xl border border-brand-border text-xs font-bold">
              <button
                type="button"
                onClick={() => setBetType("SINGLE")}
                className={`flex-1 py-1.5 rounded-lg transition-colors ${
                  betType === "SINGLE" ? "bg-brand-card text-brand-accent" : "text-brand-textSecondary"
                }`}
              >
                Simples
              </button>
              <button
                type="button"
                onClick={() => setBetType("MULTIPLE")}
                className={`flex-1 py-1.5 rounded-lg transition-colors ${
                  betType === "MULTIPLE" ? "bg-brand-accent text-brand-darkest shadow-glow" : "text-brand-textSecondary"
                }`}
              >
                Múltipla ({selections.length}x)
              </button>
            </div>
          )}

          {/* Selections List */}
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {selections.map((sel) => (
              <div
                key={sel.oddId}
                className="bg-brand-card border border-brand-border/70 rounded-xl p-2.5 relative group"
              >
                <button
                  onClick={() => removeSelection(sel.oddId)}
                  className="absolute top-2 right-2 text-brand-textMuted hover:text-red-400 transition-colors p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <p className="text-[11px] text-brand-textMuted font-medium pr-5 truncate">{sel.eventName}</p>
                <div className="flex items-center justify-between mt-1">
                  <div>
                    <span className="text-xs font-bold text-white block">{sel.selectionLabel}</span>
                    <span className="text-[10px] text-brand-textSecondary">{sel.marketName}</span>
                  </div>
                  <span className="text-sm font-extrabold text-brand-accent">
                    {sel.oddValue.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Stake Selector & Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-brand-textSecondary">Valor da Aposta (Virtual):</span>
              <button
                onClick={clearSlip}
                className="text-[11px] text-brand-textMuted hover:text-red-400 flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Limpar
              </button>
            </div>

            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-bold text-brand-textMuted">R$</span>
              <input
                type="number"
                min="1"
                step="5"
                value={stake}
                onChange={(e) => setStake(Math.max(1, Number(e.target.value)))}
                className="w-full pl-9 pr-3 py-2 bg-brand-darkest border border-brand-border rounded-xl text-sm font-bold text-white focus:outline-none focus:border-brand-accent"
              />
            </div>

            {/* Quick buttons */}
            <div className="flex gap-1.5">
              {quickStakes.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setStake(amt)}
                  className={`flex-1 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                    stake === amt
                      ? "bg-brand-accent/20 border-brand-accent text-brand-accent"
                      : "bg-brand-darkest border-brand-border text-brand-textSecondary hover:text-white"
                  }`}
                >
                  +{amt}
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-brand-darkest border border-brand-border/60 rounded-xl p-3 space-y-1.5 text-xs">
            <div className="flex justify-between text-brand-textSecondary">
              <span>Cotação Total:</span>
              <span className="font-bold text-white">{totalOdds.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-bold pt-1 border-t border-brand-border/40">
              <span className="text-white">Retorno Potencial:</span>
              <span className="text-brand-accent font-extrabold text-base">
                {formatCurrency(potentialReturn)}
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleConfirm}
            disabled={isSubmitting || selections.length === 0}
            className="w-full py-3 bg-brand-accent text-brand-darkest font-black text-sm rounded-xl hover:bg-brand-accentHover transition-all shadow-glow disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              "Confirmando no Servidor..."
            ) : user ? (
              `Confirmar Aposta Virtual (${formatCurrency(stake)})`
            ) : (
              "Faça Login para Apostar"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
