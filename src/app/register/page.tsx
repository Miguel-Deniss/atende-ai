"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Check, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/contexts/AuthContext";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { AuthFooter } from "@/components/auth/AuthFooter";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "", companyName: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");

  const update = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
    if (formError) setFormError("");
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
      setFormError(result.error || "Erro ao criar conta");
    }
  };

  const passwordsMatch = form.confirmPassword && form.password === form.confirmPassword;
  const passwordsMismatch = form.confirmPassword && form.password !== form.confirmPassword;

  return (
    <AuthShell>
      <AuthHeader
        title="Criar sua conta"
        description="Comece a automatizar seu atendimento hoje"
      />

      {formError && (
        <div className="flex items-start gap-2 p-3 mb-4 rounded-xl border border-red-500/30 bg-red-500/10 text-sm text-red-400">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="name">Nome completo</Label>
          <Input id="name" placeholder="Seu nome" value={form.name}
            onChange={(e) => update("name", e.target.value)}
            autoComplete="name"
            className={errors.name ? "border-red-500/60" : ""} />
          {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="seu@email.com" value={form.email}
            onChange={(e) => update("email", e.target.value)}
            autoComplete="email"
            className={errors.email ? "border-red-500/60" : ""} />
          {errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="companyName">Nome da empresa</Label>
          <Input id="companyName" placeholder="Minha Empresa Ltda" value={form.companyName}
            onChange={(e) => update("companyName", e.target.value)}
            autoComplete="organization"
            className={errors.companyName ? "border-red-500/60" : ""} />
          {errors.companyName && <p className="text-xs text-red-400">{errors.companyName}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Telefone (opcional)</Label>
          <Input id="phone" placeholder="(11) 99999-8888" value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            autoComplete="tel" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <PasswordInput
            id="password"
            placeholder="Mínimo 8 caracteres"
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            autoComplete="new-password"
            className={errors.password ? "border-red-500/60" : ""}
          />
          {form.password && <PasswordStrength password={form.password} />}
          {errors.password && <p className="text-xs text-red-400">{errors.password}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmar senha</Label>
          <div className="relative">
            <PasswordInput
              id="confirmPassword"
              placeholder="Repita a senha"
              value={form.confirmPassword}
              onChange={(e) => update("confirmPassword", e.target.value)}
              autoComplete="new-password"
              className={errors.confirmPassword ? "border-red-500/60" : ""}
            />
            {form.confirmPassword && (
              passwordsMatch ? <Check className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                : <X className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400" />
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

      <AuthFooter />
    </AuthShell>
  );
}
