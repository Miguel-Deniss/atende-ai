"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, AlertTriangle, ShieldAlert, CreditCard, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { RememberMe } from "@/components/auth/RememberMe";

type BlockState = "COMPANY_SUSPENDED" | "ACCOUNT_DISABLED" | null;

interface LoginFormProps {
  next?: string;
}

export function LoginForm({ next }: LoginFormProps) {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [useRecovery, setUseRecovery] = useState(false);
  const [blocked, setBlocked] = useState<BlockState>(null);
  const [emailError, setEmailError] = useState("");

  const getNext = useCallback((): string => {
    if (next && next.startsWith("/") && !next.startsWith("//")) {
      return next;
    }
    const raw = new URLSearchParams(window.location.search).get("next");
    if (raw && raw.startsWith("/") && !raw.startsWith("//")) {
      return raw;
    }
    return "/dashboard";
  }, [next]);

  const validateEmail = useCallback((value: string) => {
    if (!value.trim()) {
      setEmailError("Email é obrigatório");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
      setEmailError("Email inválido");
      return false;
    }
    setEmailError("");
    return true;
  }, []);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateEmail(email)) return;
    if (!password) {
      setError("Senha é obrigatória");
      return;
    }

    setLoading(true);
    const result = await login(email.trim(), password, undefined, rememberMe);
    setLoading(false);

    if (result.requiresTwoFactor) {
      setRequiresTwoFactor(true);
      return;
    }

    if (result.code === "COMPANY_SUSPENDED") {
      setBlocked("COMPANY_SUSPENDED");
      return;
    }
    if (result.code === "ACCOUNT_DISABLED") {
      setBlocked("ACCOUNT_DISABLED");
      return;
    }

    if (result.success) {
      window.location.href = getNext();
      return;
    }

    setError(result.error || "Email ou senha inválidos.");
  };

  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const code = useRecovery ? recoveryCode : totpCode;
    if (!code) {
      setError(useRecovery ? "Digite um código de recuperação" : "Digite o código de verificação");
      return;
    }

    setLoading(true);
    const result = await login(email.trim(), password, code, rememberMe);
    setLoading(false);

    if (result.success) {
      window.location.href = getNext();
      return;
    }

    setError(result.error || "Código inválido. Tente novamente.");
  };

  const handleBack = () => {
    setRequiresTwoFactor(false);
    setTotpCode("");
    setRecoveryCode("");
    setUseRecovery(false);
    setError("");
  };

  const emailInputClass = useMemo(
    () => (emailError ? "border-red-500/60 focus-visible:ring-red-500/40" : ""),
    [emailError]
  );

  return (
    <AnimatePresence mode="wait">
      {blocked === "COMPANY_SUSPENDED" ? (
        <motion.div
          key="company-suspended"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="text-center py-8"
        >
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <CreditCard className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Assinatura suspensa</h2>
          <p className="text-sm text-gray-400 mb-8 max-w-sm mx-auto">
            Sua assinatura encontra-se suspensa. Para continuar usando o AtendeAI,
            regularize o pagamento.
          </p>
          <Link href="/#planos">
            <Button className="w-full" size="lg">
              Regularizar pagamento
            </Button>
          </Link>
          <button
            onClick={() => setBlocked(null)}
            className="mt-4 text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            Voltar ao login
          </button>
        </motion.div>
      ) : blocked === "ACCOUNT_DISABLED" ? (
        <motion.div
          key="account-disabled"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="text-center py-8"
        >
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Conta desativada</h2>
          <p className="text-sm text-gray-400 mb-8 max-w-sm mx-auto">
            Sua conta foi desativada. Entre em contato com o suporte para mais informações.
          </p>
          <Link href="mailto:suporte@atendeai.com">
            <Button variant="outline" className="w-full" size="lg">
              Falar com o suporte
            </Button>
          </Link>
          <button
            onClick={() => setBlocked(null)}
            className="mt-4 text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            Voltar ao login
          </button>
        </motion.div>
      ) : requiresTwoFactor ? (
        <motion.div
          key="twofa"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mb-6">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-300 transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-7 h-7 text-blue-400" />
            </div>
            <h2 className="text-xl font-bold text-white text-center mb-2">
              Verificação em duas etapas
            </h2>
            <p className="text-sm text-gray-500 text-center">
              {useRecovery
                ? "Digite um dos seus códigos de recuperação."
                : "Digite o código de 6 dígitos do seu aplicativo autenticador."}
            </p>
          </div>

          <form onSubmit={handleTwoFactorSubmit} className="space-y-4">
            {useRecovery ? (
              <div className="space-y-2">
                <Label htmlFor="recoveryCode">Código de recuperação</Label>
                <Input
                  id="recoveryCode"
                  value={recoveryCode}
                  onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                  placeholder="XXXX-XXXX-XXXX"
                  autoComplete="one-time-code"
                  autoFocus
                  className="font-mono tracking-widest"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="totpCode">Código de verificação</Label>
                <Input
                  id="totpCode"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  className="text-center font-mono text-lg tracking-[0.5em]"
                />
              </div>
            )}

            {error && <p className="text-sm text-red-400">{error}</p>}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verificar e entrar"}
            </Button>

            <button
              type="button"
              onClick={() => setUseRecovery((v) => !v)}
              className="w-full text-center text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              {useRecovery ? "Usar código do autenticador" : "Usar código de recuperação"}
            </button>
          </form>
        </motion.div>
      ) : (
        <motion.div
          key="credentials"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-2xl font-bold text-white text-center mb-2">Bem-vindo de volta!</h1>
          <p className="text-sm text-gray-500 text-center mb-8">
            Faça login para acessar sua empresa.
          </p>

          {error && (
            <div className="flex items-start gap-2 p-3 mb-4 rounded-xl border border-red-500/30 bg-red-500/10 text-sm text-red-400">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <form onSubmit={handleCredentialsSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) validateEmail(e.target.value);
                }}
                onBlur={() => validateEmail(email)}
                placeholder="seu@email.com"
                autoComplete="email"
                autoFocus
                className={emailInputClass}
                aria-invalid={!!emailError}
                aria-describedby={emailError ? "email-error" : undefined}
              />
              {emailError && (
                <p id="email-error" className="text-xs text-red-400">
                  {emailError}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Esqueci minha senha
                </Link>
              </div>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <RememberMe checked={rememberMe} onChange={setRememberMe} />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Não tem uma conta?{" "}
              <Link
                href="/register"
                className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
              >
                Criar conta
              </Link>
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
