import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = "BRL"): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatOdds(odd: number): string {
  return odd.toFixed(2);
}

export function formatCompactNumber(number: number): string {
  return new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    compactDisplay: "short",
  }).format(number);
}

export function sanitizeUser<T extends { passwordHash?: string; mfaSecret?: string | null }>(user: T) {
  const { passwordHash, mfaSecret, ...safeUser } = user;
  return safeUser;
}
