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
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (
    email: string,
    password: string,
    totpCode?: string
  ) => Promise<{
    success: boolean;
    requiresTwoFactor?: boolean;
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

async function apiFetch(url: string, options?: RequestInit) {
  console.log("CHAMANDO API:", url);

  const response = await fetch(url, {
    credentials: "include",

    headers: {
      "Content-Type": "application/json",
    },

    ...options,
  });

  console.log("STATUS API:", response.status);

  const text = await response.text();

  console.log("STATUS:", response.status);
  console.log("URL FINAL:", response.url);
  console.log("HTML RECEBIDO:", text.substring(0, 300));

  if (!text) {
    throw new Error("Resposta vazia da API");
  }

  const data = JSON.parse(text);

  console.log("JSON:", data);

  if (!data.success) {
    throw new Error(data.error || "Erro interno");
  }

  return data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);

  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const data = await apiFetch("/api/auth/me");

      console.log("USUARIO ATUAL:", data);

      setUser(data.data);
    } catch (error) {
      console.log("ERRO REFRESH USER:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string, totpCode?: string) => {
    console.log("ENTROU NO AUTH LOGIN");

    try {
      console.log("ENVIANDO LOGIN:", email);

      const data = await apiFetch("/api/auth/login", {
        method: "POST",

        body: JSON.stringify({
          email,
          password,
          totpCode,
        }),
      });

      console.log("RESPOSTA LOGIN:", data);

      const loggedUser = data.data.user;

      console.log("USUARIO EXTRAIDO:", loggedUser);

      setUser(loggedUser);

      console.log("USER SALVO NO CONTEXT:", loggedUser);

      return {
        success: true,
      };
    } catch (error) {
      console.error("ERRO LOGIN AUTH:", error);

      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro ao entrar",
      };
    }
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string, companyName: string, phone?: string) => {
      try {
        const data = await apiFetch("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({
            name,
            email,
            password,
            companyName,
            phone,
          }),
        });

        setUser(data.user);

        return {
          success: true,
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
