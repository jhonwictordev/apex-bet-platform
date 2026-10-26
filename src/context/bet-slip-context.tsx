"use client";

import React, { createContext, useContext, useState, useMemo } from "react";
import { useAuth } from "./auth-context";

export interface BetSlipSelection {
  eventId: string;
  eventName: string;
  marketId: string;
  marketName: string;
  oddId: string;
  selectionLabel: string;
  oddValue: number;
}

interface BetSlipContextType {
  selections: BetSlipSelection[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  stake: number;
  setStake: (amount: number) => void;
  betType: "SINGLE" | "MULTIPLE";
  setBetType: (type: "SINGLE" | "MULTIPLE") => void;
  addSelection: (selection: BetSlipSelection) => void;
  removeSelection: (oddId: string) => void;
  clearSlip: () => void;
  totalOdds: number;
  potentialReturn: number;
  placeBet: () => Promise<{ success: boolean; message?: string }>;
  isSubmitting: boolean;
}

const BetSlipContext = createContext<BetSlipContextType | undefined>(undefined);

export function BetSlipProvider({ children }: { children: React.ReactNode }) {
  const { user, refreshUser } = useAuth();
  const [selections, setSelections] = useState<BetSlipSelection[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [stake, setStake] = useState<number>(50);
  const [betType, setBetType] = useState<"SINGLE" | "MULTIPLE">("SINGLE");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addSelection = (newSel: BetSlipSelection) => {
    setSelections((prev) => {
      // Check if already in slip: toggle off
      if (prev.some((s) => s.oddId === newSel.oddId)) {
        return prev.filter((s) => s.oddId !== newSel.oddId);
      }
      // Remove other selections from same market on same event
      const filtered = prev.filter(
        (s) => !(s.eventId === newSel.eventId && s.marketId === newSel.marketId)
      );
      const updated = [...filtered, newSel];
      if (updated.length > 1) {
        setBetType("MULTIPLE");
      }
      return updated;
    });
    setIsOpen(true);
  };

  const removeSelection = (oddId: string) => {
    setSelections((prev) => {
      const updated = prev.filter((s) => s.oddId !== oddId);
      if (updated.length <= 1) {
        setBetType("SINGLE");
      }
      return updated;
    });
  };

  const clearSlip = () => {
    setSelections([]);
  };

  const totalOdds = useMemo(() => {
    if (selections.length === 0) return 0;
    if (betType === "SINGLE" && selections.length === 1) {
      return selections[0].oddValue;
    }
    const combined = selections.reduce((acc, curr) => acc * curr.oddValue, 1.0);
    return Number(combined.toFixed(2));
  }, [selections, betType]);

  const potentialReturn = useMemo(() => {
    return Number((stake * totalOdds).toFixed(2));
  }, [stake, totalOdds]);

  const placeBet = async () => {
    if (!user) {
      return { success: false, message: "Faça login para registrar apostas virtuais." };
    }
    if (selections.length === 0) {
      return { success: false, message: "Adicione ao menos uma seleção ao cupom." };
    }
    if (stake <= 0) {
      return { success: false, message: "Insira um valor de aposta válido." };
    }
    if ((user.wallet?.demoBalance || 0) < stake) {
      return { success: false, message: "Saldo virtual insuficiente. Recarregue no Faucet." };
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/sports/bet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: selections.length > 1 ? betType : "SINGLE",
          stake,
          selections,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, message: data.error || "Erro ao registrar aposta." };
      }

      await refreshUser();
      clearSlip();
      return { success: true, message: "Aposta esportiva virtual registrada com sucesso!" };
    } catch (e: any) {
      return { success: false, message: e.message || "Erro de rede ao registrar aposta." };
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BetSlipContext.Provider
      value={{
        selections,
        isOpen,
        setIsOpen,
        stake,
        setStake,
        betType,
        setBetType,
        addSelection,
        removeSelection,
        clearSlip,
        totalOdds,
        potentialReturn,
        placeBet,
        isSubmitting,
      }}
    >
      {children}
    </BetSlipContext.Provider>
  );
}

export function useBetSlip() {
  const context = useContext(BetSlipContext);
  if (!context) {
    throw new Error("useBetSlip must be used within a BetSlipProvider");
  }
  return context;
}
