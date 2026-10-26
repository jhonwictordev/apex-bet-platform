"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export interface UserSession {
  id: string;
  email: string;
  username: string;
  role: string;
  wallet?: {
    id: string;
    demoBalance: number;
    currency: string;
    totalDepositedVirtual?: number;
    totalWithdrawnVirtual?: number;
  };
  compliance?: {
    isSelfExcluded: boolean;
    sessionTimeLimitMinutes?: number;
  };
}

interface AuthContextType {
  user: UserSession | null;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
  login: (login: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, username: string, pass: string, birthDate?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refillFaucet: () => Promise<{ success: boolean; message?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setUser(json.data);
          return;
        }
      }
      setUser(null);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (loginValue: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login: loginValue, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Falha ao entrar" };
      }
      await refreshUser();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || "Erro de conexão" };
    }
  };

  const register = async (email: string, username: string, password: string, birthDate?: string) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password, birthDate }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Falha ao cadastrar" };
      }
      await refreshUser();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || "Erro de conexão" };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      window.location.href = "/";
    } catch (e) {
      console.error(e);
    }
  };

  const refillFaucet = async () => {
    try {
      const res = await fetch("/api/wallet/faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetAmount: 10000.0 }),
      });
      const data = await res.json();
      if (data.success) {
        await refreshUser();
        return { success: true, message: data.message };
      }
      return { success: false, message: data.error };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        refreshUser,
        login,
        register,
        logout,
        refillFaucet,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
