"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  companyId: string;
  company?: {
    name: string;
    status: string;
    planType: string;
    subscriptionStatus: string;
  };
  twoFactorEnabled?: boolean;
  emailVerified?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (
    email: string,
    password: string,
    totpCode?: string,
    rememberMe?: boolean
  ) => Promise<{
    success: boolean;
    requiresTwoFactor?: boolean;
    userId?: string;
    code?: string;
    error?: string;
  }>;

  register: (
    name: string,
    email: string,
    password: string,
    companyName: string,
    phone?: string
  ) => Promise<{
    success: boolean;
    requiresEmailVerification?: boolean;
    email?: string;
    error?: string;
  }>;

  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth precisa estar dentro do AuthProvider");
  }

  return context;
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: "include",

    headers: {
      "Content-Type": "application/json",
    },

    ...options,
  });

  const text = await response.text();

  if (!text) {
    throw new Error("Resposta vazia da API");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Resposta inválida da API");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Resposta inválida da API");
  }

  const data = parsed as {
    success?: boolean;
    error?: string;
    code?: string;
    data?: T;
  };

  if (!data.success) {
    const error = new Error(data.error || "Erro interno") as Error & { code?: string };
    error.code = data.code;
    throw error;
  }

  return data.data as T;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);

  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await apiFetch<User>("/api/auth/me");
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(
    async (email: string, password: string, totpCode?: string, rememberMe?: boolean) => {
      try {
        const data = await apiFetch<{
          requiresTwoFactor?: boolean;
          userId?: string;
          user?: User;
        }>("/api/auth/login", {
          method: "POST",

          body: JSON.stringify({
            email,
            password,
            totpCode,
            rememberMe,
          }),
        });

        if (data.requiresTwoFactor) {
          return {
            success: false,
            requiresTwoFactor: true,
            userId: data.userId,
          };
        }

        const loggedUser = data.user;

        if (!loggedUser) {
          throw new Error("Usuário ausente na resposta de login");
        }

        setUser(loggedUser);

        return {
          success: true,
        };
      } catch (error) {
        console.error("ERRO LOGIN AUTH:", error);

        return {
          success: false,
          code: error instanceof Error ? (error as Error & { code?: string }).code : undefined,
          error: error instanceof Error ? error.message : "Erro ao entrar",
        };
      }
    },
    []
  );

  const register = useCallback(
    async (name: string, email: string, password: string, companyName: string, phone?: string) => {
      try {
        const data = await apiFetch<{ requiresEmailVerification: boolean; email: string }>(
          "/api/auth/register",
          {
            method: "POST",
            body: JSON.stringify({
              name,
              email,
              password,
              companyName,
              phone,
            }),
          }
        );

        return {
          success: true,
          requiresEmailVerification: data.requiresEmailVerification,
          email: data.email,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Erro ao cadastrar",
        };
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      setUser(null);

      router.push("/login");
    }
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
