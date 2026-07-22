"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  companyId: string;
  companyName?: string;
  twoFactorEnabled?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (
    email: string,
    password: string,
    totpCode?: string
  ) => Promise<{ success: boolean; requiresTwoFactor?: boolean; error?: string }>;
  register: (
    name: string,
    email: string,
    password: string,
    companyName: string,
    phone?: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: async () => {},
  refreshUser: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

async function apiFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || "Erro interno");
  return data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  console.log("AUTH PROVIDER CARREGOU");

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    try {
      const data = await apiFetch("/api/auth/me");

      console.log("ME RESPONSE:", data);
      console.log("USER RECEBIDO:", data.data);

      setUser(data.data);
    } catch (error) {
      console.log("ME ERROR:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string, totpCode?: string) => {
    try {
      const data = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password, totpCode }),
      });

      if (data.data.requiresTwoFactor) {
        return { success: true, requiresTwoFactor: true };
      }

      const loggedUser = data.data.user ?? data.data;

      console.log("LOGIN USER:", loggedUser);

      setUser(loggedUser);

      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string, companyName: string, phone?: string) => {
      try {
        const data = await apiFetch("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({ name, email, password, companyName, phone }),
        });
        setUser(data.data.user);
        return { success: true };
      } catch (err) {
        return { success: false, error: (err as Error).message };
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {
    } finally {
      setUser(null);
      router.push("/login");
    }
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
