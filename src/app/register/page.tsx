"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MessageSquareMore, ArrowRight, Eye, EyeOff, Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "", companyName: "", phone: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Nome é obrigatório";
    if (!form.email.trim()) errs.email = "Email é obrigatório";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Email inválido";
    if (!form.password) errs.password = "Senha é obrigatória";
    else if (form.password.length < 8) errs.password = "Mínimo 8 caracteres";
    else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) errs.password = "Deve conter maiúscula, minúscula e número";
    if (!form.confirmPassword) errs.confirmPassword = "Confirme a senha";
    else if (form.password !== form.confirmPassword) errs.confirmPassword = "Senhas não conferem";
    if (!form.companyName.trim()) errs.companyName = "Nome da empresa é obrigatório";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const result = await register(form.name.trim(), form.email.trim(), form.password, form.companyName.trim(), form.phone.trim() || undefined);
    setLoading(false);

    if (result.success) {
      toast("Conta criada com sucesso! Bem-vindo ao AtendeAI.");
      router.push("/dashboard");
    } else {
      toast(result.error || "Erro ao criar conta", "error");
    }
  };

  const passwordsMatch = form.confirmPassword && form.password === form.confirmPassword;
  const passwordsMismatch = form.confirmPassword && form.password !== form.confirmPassword;

  const passwordStrength = form.password
    ? [
      form.password.length >= 8,
      /[a-z]/.test(form.password),
      /[A-Z]/.test(form.password),
      /\d/.test(form.password),
      /[^a-zA-Z0-9]/.test(form.password),
    ].filter(Boolean).length
    : 0;

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
            <h1 className="text-2xl font-bold text-white mb-2">Criar sua conta</h1>
            <p className="text-sm text-gray-500">Comece a automatizar seu atendimento hoje</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input id="name" placeholder="Seu nome" value={form.name}
                onChange={(e) => update("name", e.target.value)}
                className={errors.name ? "border-red-500/50" : ""} />
              {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="seu@email.com" value={form.email}
                onChange={(e) => update("email", e.target.value)}
                className={errors.email ? "border-red-500/50" : ""} />
              {errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName">Nome da empresa</Label>
              <Input id="companyName" placeholder="Minha Empresa Ltda" value={form.companyName}
                onChange={(e) => update("companyName", e.target.value)}
                className={errors.companyName ? "border-red-500/50" : ""} />
              {errors.companyName && <p className="text-xs text-red-400">{errors.companyName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone (opcional)</Label>
              <Input id="phone" placeholder="(11) 99999-8888" value={form.phone}
                onChange={(e) => update("phone", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="Mínimo 8 caracteres"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  className={`pr-10 ${errors.password ? "border-red-500/50" : ""}`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.password && (
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div key={level} className={`h-1 flex-1 rounded-full transition-colors ${
                      passwordStrength >= level ? "bg-blue-400" : "bg-gray-700"
                    }`} />
                  ))}
                </div>
              )}
              {errors.password && <p className="text-xs text-red-400">{errors.password}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar senha</Label>
              <div className="relative">
                <Input id="confirmPassword" type="password" placeholder="Repita a senha"
                  value={form.confirmPassword}
                  onChange={(e) => update("confirmPassword", e.target.value)}
                  className={`pr-10 ${errors.confirmPassword ? "border-red-500/50" : ""}`} />
                {form.confirmPassword && (
                  passwordsMatch ? <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                    : <X className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400" />
                )}
              </div>
              {errors.confirmPassword && <p className="text-xs text-red-400">{errors.confirmPassword}</p>}
            </div>

            <Button type="submit" className="w-full group" size="lg" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <>Criar conta <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
              )}
            </Button>

            <p className="text-xs text-gray-600 text-center">
              Ao criar sua conta, você aceita nossos{" "}
              <Link href="/terms" className="text-blue-400 hover:underline">Termos de uso</Link> e{" "}
              <Link href="/privacy" className="text-blue-400 hover:underline">Política de privacidade</Link>.
            </p>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Já tem uma conta?{" "}
              <Link href="/login" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
                Fazer login
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
