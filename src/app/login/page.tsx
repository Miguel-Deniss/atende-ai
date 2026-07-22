"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MessageSquareMore, ArrowRight, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!email.trim()) newErrors.email = "Email é obrigatório";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Email inválido";
    if (!password) newErrors.password = "Senha é obrigatória";
    else if (password.length < 6) newErrors.password = "Mínimo 6 caracteres";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const result = await login(email, password, showTwoFactor ? totpCode : undefined);
    setLoading(false);

    if (result.requiresTwoFactor) {
      setShowTwoFactor(true);
      toast("Insira o código de autenticação", "info");
      return;
    }

    if (result.success) {
      toast("Login realizado com sucesso!");
      router.push("/dashboard");
      router.refresh();
    }

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-400/5 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-md"
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-blue-400/10 rounded-3xl blur-2xl" />

        <div className="relative glass rounded-2xl border border-border/50 p-8 shadow-2xl">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <MessageSquareMore className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">
                Atende<span className="text-blue-400">AI</span>
              </span>
            </Link>
            <h1 className="text-2xl font-bold text-white mb-2">Bem-vindo de volta</h1>
            <p className="text-sm text-gray-500">Entre na sua conta para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!showTwoFactor ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setErrors((prev) => ({ ...prev, email: "" })); }}
                    className={errors.email ? "border-red-500/50" : ""}
                    autoComplete="email"
                  />
                  {errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Senha</Label>
                    <Link href="/forgot-password" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                      Esqueceu a senha?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setErrors((prev) => ({ ...prev, password: "" })); }}
                      className={`pr-10 ${errors.password ? "border-red-500/50" : ""}`}
                      autoComplete="current-password"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-red-400">{errors.password}</p>}
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-4">
                  <ShieldCheck className="w-5 h-5 text-blue-400" />
                  <p className="text-sm text-gray-300">Autenticação em dois fatores</p>
                </div>
                <Label htmlFor="totp">Código de verificação</Label>
                <Input id="totp" type="text" placeholder="000000" maxLength={6}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="text-center text-2xl tracking-widest"
                  autoFocus
                />
              </div>
            )}

            <Button type="submit" className="w-full group" size="lg" disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {showTwoFactor ? "Verificar" : "Entrar"}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Não tem uma conta?{" "}
              <Link href="/register" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
                Criar conta
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
}