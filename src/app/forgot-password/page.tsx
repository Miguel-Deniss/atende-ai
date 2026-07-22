"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MessageSquareMore, ArrowRight, Mail, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast("Email é obrigatório", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setSent(true);
      } else {
        toast(data.error || "Erro ao solicitar redefinição", "error");
      }
    } catch {
      toast("Erro ao conectar com o servidor", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-400/5 rounded-full blur-[100px]" />
      </div>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        className="relative w-full max-w-md">
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
            <h1 className="text-2xl font-bold text-white mb-2">
              {sent ? "Email enviado" : "Recuperar senha"}
            </h1>
            <p className="text-sm text-gray-500">
              {sent ? "Verifique sua caixa de entrada para redefinir sua senha." : "Digite seu email para receber instruções."}
            </p>
          </div>

          {sent ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <p className="text-sm text-gray-400 mb-6">
                Se o email existir em nossa base, você receberá um link para redefinir sua senha.
              </p>
              <Link href="/login">
                <Button variant="outline">Voltar ao login</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input id="email" type="email" placeholder="seu@email.com"
                    className="pl-10" value={email}
                    onChange={(e) => setEmail(e.target.value)} autoFocus />
                </div>
              </div>
              <Button type="submit" className="w-full group" size="lg" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <>Enviar <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                )}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
              Voltar ao login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
