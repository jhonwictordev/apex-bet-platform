"use client";

import React from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { formatOdds } from "@/lib/utils";

interface OddsDisplayProps {
  label: string;
  value: number;
  isSelected?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  size?: "sm" | "md" | "lg";
  trend?: "up" | "down" | null;
  disabled?: boolean;
  className?: string;
  subLabel?: string;
}

export function OddsDisplay({
  label,
  value,
  isSelected = false,
  onClick,
  size = "md",
  trend,
  disabled = false,
  className = "",
  subLabel,
}: OddsDisplayProps) {
  const sizeClasses = {
    sm: "px-2 py-1.5 text-xs min-h-[38px]",
    md: "px-3 py-2 text-xs min-h-[44px]",
    lg: "px-4 py-2.5 text-sm min-h-[52px]",
  }[size];

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`group relative flex items-center justify-between gap-2 rounded-xl font-bold transition-all duration-150 select-none active:scale-[0.97] cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${sizeClasses} ${
        isSelected
          ? "bg-brand-accent text-brand-darkest border border-brand-accent shadow-glow"
          : "bg-brand-card hover:bg-brand-cardHover border border-brand-border text-brand-textSecondary hover:text-white hover:border-brand-accent/40"
      } ${className}`}
    >
      <div className="flex flex-col items-start leading-tight min-w-0 pr-1">
        <span
          className={`truncate max-w-full text-[11px] font-semibold tracking-tight ${
            isSelected ? "text-brand-darkest/90 font-bold" : "text-brand-textSecondary group-hover:text-white"
          }`}
        >
          {label}
        </span>
        {subLabel && (
          <span
            className={`text-[9px] ${
              isSelected ? "text-brand-darkest/70" : "text-brand-textMuted"
            }`}
          >
            {subLabel}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0 font-mono tabular-nums">
        {trend === "up" && (
          <ArrowUp className="w-3 h-3 text-emerald-400 animate-bounce" />
        )}
        {trend === "down" && (
          <ArrowDown className="w-3 h-3 text-red-400 animate-bounce" />
        )}
        <span
          className={`font-black tracking-tight ${
            isSelected
              ? "text-brand-darkest text-sm"
              : "text-brand-accent text-xs group-hover:text-brand-accentHover"
          }`}
        >
          {formatOdds(value)}
        </span>
      </div>
    </button>
  );
}
